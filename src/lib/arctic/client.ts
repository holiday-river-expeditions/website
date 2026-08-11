import { z } from 'zod';
import { getArcticConfig } from './config';

/**
 * Low-level Arctic Reservations REST client (server-only).
 *
 * Auth follows Arctic's installation-key OAuth flow (verified against their
 * PHP wrapper, github.com/arcticres/arctic-api): POST form-encoded password
 * grant to /api/rest/oauth/application/token, then Bearer token on requests.
 * A 403 means the token expired — clear it and retry once.
 *
 * Arctic does not support custom integrations, so every response is treated
 * as untrusted: callers Zod-parse payloads and this module retries transient
 * failures with backoff. See docs/project/arctic-api.md.
 */

const tokenResponseSchema = z.object({
    access_token: z.string(),
    expires_in: z.number().optional(),
});

// Arctic reports errors as {error, details} JSON, sometimes with HTTP 200.
const errorResponseSchema = z.object({
    error: z.string(),
    details: z.string().optional(),
});

export class ArcticError extends Error {
    constructor(
        message: string,
        readonly status?: number,
    ) {
        super(message);
        this.name = 'ArcticError';
    }
}

interface CachedToken {
    token: string;
    expiresAt: number;
}

// Module-scope token cache; survives across requests within a server
// instance, which is all the caching this traffic volume needs.
let cachedToken: CachedToken | null = null;

const TOKEN_SAFETY_WINDOW_MS = 60_000;
const DEFAULT_TOKEN_TTL_MS = 10 * 60_000;
const REQUEST_TIMEOUT_MS = 10_000;
const RETRIES = 2;

async function fetchToken(): Promise<string> {
    const config = getArcticConfig();
    if (!config) throw new ArcticError('Arctic is not configured');

    if (cachedToken && cachedToken.expiresAt > Date.now()) {
        return cachedToken.token;
    }

    const res = await fetch(
        `${config.baseUrl}/api/rest/oauth/application/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'password',
                username: config.username,
                password: config.password,
            }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            cache: 'no-store',
        },
    );

    // Arctic returns the token form-encoded (access_token=...&expires_in=...),
    // not JSON — verified live 2026-08-10. Try JSON first in case that ever
    // changes, then fall back to querystring parsing.
    const raw = await res.text();
    let payload: unknown;
    try {
        payload = JSON.parse(raw);
    } catch {
        const form = Object.fromEntries(new URLSearchParams(raw));
        payload = {
            ...form,
            ...(form.expires_in ? { expires_in: Number(form.expires_in) } : {}),
        };
    }

    const parsed = tokenResponseSchema.safeParse(payload);
    if (!parsed.success) {
        const err = errorResponseSchema.safeParse(payload);
        throw new ArcticError(
            `Arctic auth failed: ${err.success ? err.data.error : `HTTP ${res.status}`}`,
            res.status,
        );
    }

    const ttlMs = parsed.data.expires_in
        ? parsed.data.expires_in * 1000
        : DEFAULT_TOKEN_TTL_MS;
    cachedToken = {
        token: parsed.data.access_token,
        expiresAt: Date.now() + ttlMs - TOKEN_SAFETY_WINDOW_MS,
    };
    return parsed.data.access_token;
}

function clearToken(): void {
    cachedToken = null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Authenticated GET against /api/rest/<path>. Validates the payload with
 * the given Zod schema; retries transient failures (network, 5xx) with
 * exponential backoff and expired tokens (403) once.
 */
export async function arcticGet<T>(
    path: string,
    schema: z.ZodType<T>,
    params?: Record<string, string>,
): Promise<T> {
    const config = getArcticConfig();
    if (!config) throw new ArcticError('Arctic is not configured');

    const url = new URL(`${config.baseUrl}/api/rest/${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
        url.searchParams.set(key, value);
    }

    let lastError: unknown;
    let retriedAuth = false;

    for (let attempt = 0; attempt <= RETRIES; attempt++) {
        if (attempt > 0) await sleep(250 * 2 ** attempt);

        try {
            const token = await fetchToken();
            const res = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                cache: 'no-store',
            });

            // Expired token: clear and retry once without burning a
            // transient-failure attempt.
            if (res.status === 403 && !retriedAuth) {
                clearToken();
                retriedAuth = true;
                attempt--;
                continue;
            }

            if (res.status >= 500) {
                lastError = new ArcticError(
                    `Arctic server error (HTTP ${res.status})`,
                    res.status,
                );
                continue;
            }

            const json: unknown = await res.json();

            const errorPayload = errorResponseSchema.safeParse(json);
            if (errorPayload.success) {
                throw new ArcticError(
                    `Arctic error: ${errorPayload.data.error}${errorPayload.data.details ? ` — ${errorPayload.data.details}` : ''}`,
                    res.status,
                );
            }
            if (!res.ok) {
                throw new ArcticError(
                    `Arctic request failed (HTTP ${res.status})`,
                    res.status,
                );
            }

            return schema.parse(json);
        } catch (error) {
            // Zod mismatches and explicit Arctic errors are not transient —
            // rethrow instead of hammering the API.
            if (error instanceof ArcticError || error instanceof z.ZodError) {
                throw error;
            }
            lastError = error;
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new ArcticError('Arctic request failed after retries');
}
