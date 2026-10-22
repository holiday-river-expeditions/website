// Slugs owned by dedicated routes (or reserved for ones on the roadmap).
// A `page` document with one of these slugs would be silently shadowed by
// the static route, so the CMS page route 404s them explicitly and the
// sitemap leaves them out.
export const RESERVED_SLUGS = new Set([
    'admin',
    'api',
    'biking',
    'blog',
    'book',
    'contact',
    'faq',
    'open-seats',
    'rafting',
    'rivers',
    'specialty',
    'store',
    'studio',
    'trip-dates',
    'trip-finder',
    'trips',
]);
