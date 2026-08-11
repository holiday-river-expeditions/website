import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { z } from 'zod';

/**
 * Arctic client tests run against a mocked fetch — there is no Arctic
 * sandbox (docs/project/arctic-api.md), so coverage focuses on our side:
 * auth flow, token reuse, 403 re-auth, retry, and error surfacing.
 */

const ENV_KEYS = [
    'ARCTIC_API_BASE_URL',
    'ARCTIC_CLIENT_ID',
    'ARCTIC_CLIENT_SECRET',
    'ARCTIC_USERNAME',
    'ARCTIC_PASSWORD',
] as const;

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

// Arctic returns the token form-encoded, not JSON (verified live).
function tokenOk(token = 'token-1') {
    return new Response(
        `access_token=${token}&token_type=bearer&expires_in=3600&refresh_token=r1`,
        { status: 200, headers: { 'Content-Type': 'text/html' } },
    );
}

beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    process.env.ARCTIC_API_BASE_URL = 'https://holidayriver.arcticres.com';
    process.env.ARCTIC_CLIENT_ID = 'client-id';
    process.env.ARCTIC_CLIENT_SECRET = 'client-secret';
    process.env.ARCTIC_USERNAME = 'api-user';
    process.env.ARCTIC_PASSWORD = 'api-pass';
});

afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
});

async function importClient() {
    return import('./client');
}

const echoSchema = z.object({ ok: z.boolean() });

test('exchanges credentials for a token, then sends Bearer request', async () => {
    fetchMock
        .mockResolvedValueOnce(tokenOk())
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const { arcticGet } = await importClient();
    const result = await arcticGet('trip', echoSchema);

    expect(result).toEqual({ ok: true });

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0] as [
        string,
        RequestInit,
    ];
    expect(String(tokenUrl)).toBe(
        'https://holidayriver.arcticres.com/api/rest/oauth/application/token',
    );
    expect(String(tokenInit.body)).toContain('grant_type=password');

    const [apiUrl, apiInit] = fetchMock.mock.calls[1] as [URL, RequestInit];
    expect(String(apiUrl)).toBe(
        'https://holidayriver.arcticres.com/api/rest/trip',
    );
    expect((apiInit.headers as Record<string, string>).Authorization).toBe(
        'Bearer token-1',
    );
});

test('reuses the cached token across requests', async () => {
    fetchMock
        .mockResolvedValueOnce(tokenOk())
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const { arcticGet } = await importClient();
    await arcticGet('trip', echoSchema);
    await arcticGet('triptype/5', echoSchema);

    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/oauth/'),
    );
    expect(tokenCalls).toHaveLength(1);
});

test('re-authenticates once on 403 (expired token)', async () => {
    fetchMock
        .mockResolvedValueOnce(tokenOk('stale'))
        .mockResolvedValueOnce(jsonResponse({ error: 'forbidden' }, 403))
        .mockResolvedValueOnce(tokenOk('fresh'))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const { arcticGet } = await importClient();
    const result = await arcticGet('trip', echoSchema);

    expect(result).toEqual({ ok: true });
    const lastInit = fetchMock.mock.calls[3][1] as RequestInit;
    expect((lastInit.headers as Record<string, string>).Authorization).toBe(
        'Bearer fresh',
    );
});

test('retries transient 5xx and succeeds', async () => {
    fetchMock
        .mockResolvedValueOnce(tokenOk())
        .mockResolvedValueOnce(jsonResponse({ oops: true }, 502))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const { arcticGet } = await importClient();
    await expect(arcticGet('trip', echoSchema)).resolves.toEqual({
        ok: true,
    });
});

test('surfaces Arctic {error, details} payloads without retrying', async () => {
    fetchMock
        .mockResolvedValueOnce(tokenOk())
        .mockResolvedValueOnce(
            jsonResponse({ error: 'bad request', details: 'invalid query' }),
        );

    const { arcticGet, ArcticError } = await importClient();
    await expect(arcticGet('trip', echoSchema)).rejects.toThrow(ArcticError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('throws when unconfigured', async () => {
    delete process.env.ARCTIC_API_BASE_URL;
    const { arcticGet, ArcticError } = await importClient();
    await expect(arcticGet('trip', echoSchema)).rejects.toThrow(ArcticError);
    expect(fetchMock).not.toHaveBeenCalled();
});
