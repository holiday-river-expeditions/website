/**
 * Arctic Reservations connection config, read from ARCTIC_* env vars
 * (server-only). The integration degrades gracefully when unconfigured:
 * callers check `isArcticConfigured()` and render a fallback CTA instead.
 */

export interface ArcticConfig {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
}

export function getArcticConfig(): ArcticConfig | null {
    const baseUrl = process.env.ARCTIC_API_BASE_URL;
    const clientId = process.env.ARCTIC_CLIENT_ID;
    const clientSecret = process.env.ARCTIC_CLIENT_SECRET;
    const username = process.env.ARCTIC_USERNAME;
    const password = process.env.ARCTIC_PASSWORD;

    if (!baseUrl || !clientId || !clientSecret || !username || !password) {
        return null;
    }

    return {
        baseUrl: baseUrl.replace(/\/$/, ''),
        clientId,
        clientSecret,
        username,
        password,
    };
}

export function isArcticConfigured(): boolean {
    return getArcticConfig() !== null;
}
