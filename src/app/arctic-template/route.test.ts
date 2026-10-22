import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSiteSettings } from '@/lib/sanity';
import { getSiteUrl } from '@/lib/site-url';
import { GET } from './route';

vi.mock('@/lib/sanity', () => ({
    getSiteSettings: vi.fn(),
}));

const settings = vi.mocked(getSiteSettings);

async function render() {
    const res = await GET();
    return { res, html: await res.text() };
}

describe('GET /arctic-template', () => {
    beforeEach(() => {
        settings.mockReset();
        settings.mockResolvedValue(null);
    });

    it('keeps the placeholders Arctic looks for', async () => {
        const { html } = await render();
        expect(html.match(/\{SITE-TITLE\}/g)).toHaveLength(2);
        expect(html).toContain('{SITE-BODY}');
    });

    it('is noindexed', async () => {
        const { res } = await render();
        expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    });

    it('carries the site nav and footer links', async () => {
        const { html } = await render();
        for (const label of ['Rafting', 'Specialty', 'Contact']) {
            expect(html).toContain(`>${label}</a>`);
        }
        for (const label of ['Instagram', 'Trip Dates', 'Online Store']) {
            expect(html).toContain(`>${label}</a>`);
        }
        expect(html).toContain('/logo-horizontal-red.svg');
    });

    it('only uses absolute URLs, since Arctic serves a copy from its own domain', async () => {
        const { html } = await render();
        const urls = [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map(
            (m) => m[1],
        );
        expect(urls.length).toBeGreaterThan(10);
        for (const url of urls) {
            expect(url).toMatch(/^(https:\/\/|tel:)/);
        }
        expect(html).toContain(`href="${getSiteUrl()}/contact"`);
    });

    it('uses Studio contact details and escapes them', async () => {
        settings.mockResolvedValue({
            phone: '435-555-0100',
            address: 'Box 1 <Green River>',
            socialLinks: { tiktok: 'https://www.tiktok.com/@hre' },
        } as Awaited<ReturnType<typeof getSiteSettings>>);
        const { html } = await render();
        expect(html).toContain('href="tel:+14355550100"');
        expect(html).toContain('Box 1 &lt;Green River&gt;');
        expect(html).toContain('>TikTok</a>');
    });

    it('falls back to the defaults when Sanity is down', async () => {
        settings.mockRejectedValue(new Error('down'));
        const { res, html } = await render();
        expect(res.status).toBe(200);
        expect(html).toContain('801-266-2087');
        expect(html).toContain('544 East 3900 South');
    });
});
