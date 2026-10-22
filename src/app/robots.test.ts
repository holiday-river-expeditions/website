import { afterEach, describe, expect, it, vi } from 'vitest';

// robots() reads the request host. Mock next/headers so each test can
// pretend the request came in on a different domain.
const requestHost = vi.hoisted(() => ({
    value: 'holidayriver.com' as string | null,
}));
vi.mock('next/headers', () => ({
    headers: vi.fn(
        async () =>
            new Headers(requestHost.value ? { host: requestHost.value } : {}),
    ),
}));

import robots from './robots';

const DISALLOW_ALL = { rules: { userAgent: '*', disallow: '/' } };

function setEnv(
    siteUrl: string,
    vercelEnv: string | undefined,
    host: string | null,
) {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);
    vi.stubEnv('VERCEL_ENV', vercelEnv);
    requestHost.value = host;
}

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('robots', () => {
    it('allows crawling on the launch domain in production', async () => {
        setEnv('https://holidayriver.com', 'production', 'holidayriver.com');

        expect(await robots()).toEqual({
            rules: {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/api/', '/arctic-template', '/studio'],
            },
            sitemap: 'https://holidayriver.com/sitemap.xml',
        });
    });

    it('accepts a trailing slash on the site URL and a port on the host', async () => {
        setEnv(
            'https://holidayriver.com/',
            'production',
            'holidayriver.com:443',
        );

        expect(await robots()).toMatchObject({ rules: { allow: '/' } });
    });

    it('disallows everything while the site URL is unset (today)', async () => {
        setEnv('', 'production', 'website-phi-six-25.vercel.app');

        expect(await robots()).toEqual(DISALLOW_ALL);
    });

    it('disallows everything when the site URL is the vercel.app URL', async () => {
        setEnv(
            'https://website-phi-six-25.vercel.app',
            'production',
            'website-phi-six-25.vercel.app',
        );

        expect(await robots()).toEqual(DISALLOW_ALL);
    });

    it('disallows everything on preview deployments, even with the launch URL set', async () => {
        setEnv('https://holidayriver.com', 'preview', 'holidayriver.com');

        expect(await robots()).toEqual(DISALLOW_ALL);
    });

    it('disallows everything outside Vercel (local builds)', async () => {
        setEnv('https://holidayriver.com', undefined, 'holidayriver.com');

        expect(await robots()).toEqual(DISALLOW_ALL);
    });

    it('disallows everything on the production vercel.app alias after cutover', async () => {
        setEnv(
            'https://holidayriver.com',
            'production',
            'website-phi-six-25.vercel.app',
        );

        expect(await robots()).toEqual(DISALLOW_ALL);
    });

    it('disallows everything on the beta host', async () => {
        setEnv(
            'https://holidayriver.com',
            'production',
            'beta.holidayriver.com',
        );

        expect(await robots()).toEqual(DISALLOW_ALL);
    });

    it('disallows everything when the request has no host', async () => {
        setEnv('https://holidayriver.com', 'production', null);

        expect(await robots()).toEqual(DISALLOW_ALL);
    });
});
