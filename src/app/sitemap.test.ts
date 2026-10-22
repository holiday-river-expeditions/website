import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// The sitemap reads slugs from Sanity. Mock the data layer so the test
// checks the route list without hitting the network.
const getSitemapDocuments = vi.hoisted(() => vi.fn());
vi.mock('@/lib/sanity', () => ({ getSitemapDocuments }));

import sitemap from './sitemap';

beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://holidayriver.com');
    getSitemapDocuments.mockResolvedValue({
        homepage: { _updatedAt: '2026-10-01T00:00:00Z' },
        tripTypes: [
            { slug: 'rafting', _updatedAt: '2026-10-02T00:00:00Z' },
            { slug: 'biking', _updatedAt: '2026-10-03T00:00:00Z' },
        ],
        trips: [
            { slug: 'cataract-canyon', _updatedAt: '2026-10-04T00:00:00Z' },
            { slug: null, _updatedAt: '2026-10-04T00:00:00Z' },
        ],
        rivers: [{ slug: 'green-river', _updatedAt: '2026-10-05T00:00:00Z' }],
        posts: [{ slug: 'what-to-pack', _updatedAt: '2026-10-06T00:00:00Z' }],
        pages: [
            { slug: 'about', _updatedAt: '2026-10-07T00:00:00Z' },
            // Shadowed by the /trips route, so it never renders.
            { slug: 'trips', _updatedAt: '2026-10-08T00:00:00Z' },
        ],
    });
});

afterEach(() => {
    vi.unstubAllEnvs();
});

test('lists static routes and every Sanity-driven page', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual([
        'https://holidayriver.com',
        'https://holidayriver.com/trips',
        'https://holidayriver.com/rafting',
        'https://holidayriver.com/biking',
        'https://holidayriver.com/specialty',
        'https://holidayriver.com/book',
        'https://holidayriver.com/trip-finder',
        'https://holidayriver.com/blog',
        'https://holidayriver.com/faq',
        'https://holidayriver.com/contact',
        'https://holidayriver.com/trips/cataract-canyon',
        'https://holidayriver.com/rivers/green-river',
        'https://holidayriver.com/blog/what-to-pack',
        'https://holidayriver.com/about',
    ]);
});

test('leaves out routes that are not for visitors', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    for (const path of [
        '/admin',
        '/studio',
        '/arctic-template',
        '/open-seats',
    ]) {
        expect(urls).not.toContain(`https://holidayriver.com${path}`);
    }
});

test('uses each document _updatedAt for lastModified', async () => {
    const byUrl = new Map(
        (await sitemap()).map((e) => [e.url, e.lastModified]),
    );

    expect(byUrl.get('https://holidayriver.com')).toBe('2026-10-01T00:00:00Z');
    expect(byUrl.get('https://holidayriver.com/rafting')).toBe(
        '2026-10-02T00:00:00Z',
    );
    expect(byUrl.get('https://holidayriver.com/trips/cataract-canyon')).toBe(
        '2026-10-04T00:00:00Z',
    );
    expect(byUrl.get('https://holidayriver.com/about')).toBe(
        '2026-10-07T00:00:00Z',
    );
    expect(byUrl.get('https://holidayriver.com/faq')).toBeUndefined();
});

test('falls back to the Vercel URL while NEXT_PUBLIC_SITE_URL is empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');

    const [home] = await sitemap();

    expect(home.url).toBe('https://website-phi-six-25.vercel.app');
});
