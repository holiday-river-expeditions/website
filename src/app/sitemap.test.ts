import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// The sitemap reads slugs from Sanity, plus the dates Arctic keywords tag.
// Mock the data layer so the test checks the route list without hitting
// the network.
const {
    getSitemapDocuments,
    getSpecialtyDateIndex,
    getSpecialtyFamilies,
    getAllUpcomingDepartures,
} = vi.hoisted(() => ({
    getSitemapDocuments: vi.fn(),
    getSpecialtyDateIndex: vi.fn(),
    getSpecialtyFamilies: vi.fn(),
    getAllUpcomingDepartures: vi.fn(),
}));
vi.mock('@/lib/sanity', () => ({
    getSitemapDocuments,
    getSpecialtyDateIndex,
    getSpecialtyFamilies,
}));
// The real module sets up the Arctic client.
vi.mock('@/lib/arctic', () => ({
    todayISO: () => '2026-11-19',
    getAllUpcomingDepartures,
}));

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
    getSpecialtyFamilies.mockResolvedValue([]);
    getAllUpcomingDepartures.mockResolvedValue([]);
    getSpecialtyDateIndex.mockResolvedValue([
        {
            tripSlug: 'yampa',
            arcticTripId: '59,60',
            _updatedAt: '2026-10-09T00:00:00Z',
            entries: [
                { startDate: '2027-05-15', label: 'Pompe & Honey' },
                // Past dates keep their page but leave the sitemap.
                { startDate: '2026-06-01', label: 'Last Summer' },
                // No label: the route refuses it, so it isn't listed.
                { startDate: '2027-07-01', slug: { current: 'no-label' } },
                // A second entry with the first one's address: listed once.
                {
                    startDate: '2027-08-01',
                    label: 'Other',
                    slug: { current: 'pompe-and-honey-yampa-2027-05-15' },
                },
            ],
        },
    ]);
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
        'https://holidayriver.com/specialty/pompe-and-honey-yampa-2027-05-15',
        'https://holidayriver.com/blog/what-to-pack',
        'https://holidayriver.com/about',
    ]);
});

test('lists dates Arctic keywords tag, without calling Arctic until a family has keywords', async () => {
    expect(getAllUpcomingDepartures).not.toHaveBeenCalled();
    await sitemap();
    expect(getAllUpcomingDepartures).not.toHaveBeenCalled();

    getSpecialtyFamilies.mockResolvedValue([
        { _id: 'stars', name: 'Dark Sky Stargazing', arcticKeywords: ['SG'] },
    ]);
    getAllUpcomingDepartures.mockResolvedValue([
        {
            id: 1501,
            triptypeid: 60,
            name: 'Yampa River Stargazing Special',
            start: '2027-05-26',
            keywords: ['Dinosaur', 'SG', 'Special', 'YM'],
        },
    ]);
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain(
        'https://holidayriver.com/specialty/yampa-river-stargazing-special-yampa-2027-05-26',
    );
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
