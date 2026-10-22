import type { MetadataRoute } from 'next';
import { RESERVED_SLUGS } from '@/lib/reserved-slugs';
import { getSitemapDocuments } from '@/lib/sanity';
import { absoluteUrl } from '@/lib/site-url';

// Rebuilt at most hourly. Crawlers read the sitemap rarely, so there is no
// need to match the pages' one-minute ISR window.
export const revalidate = 3600;

/**
 * Public routes that aren't driven by a single Sanity document. Left out on
 * purpose: /admin, /studio, /arctic-template and /api (not for visitors),
 * and /open-seats (redirects to /book). Specialty families are anchored
 * sections on /specialty, not pages of their own.
 */
const STATIC_ROUTES = [
    '/',
    '/trips',
    '/rafting',
    '/biking',
    '/specialty',
    '/book',
    '/trip-finder',
    '/blog',
    '/faq',
    '/contact',
] as const;

interface SluggedDoc {
    slug: string | null;
    _updatedAt: string;
}

function entries(prefix: string, docs: SluggedDoc[]): MetadataRoute.Sitemap {
    return docs.flatMap((doc) =>
        doc.slug
            ? [
                  {
                      url: absoluteUrl(`${prefix}/${doc.slug}`),
                      lastModified: doc._updatedAt,
                  },
              ]
            : [],
    );
}

/**
 * Static routes plus every published trip, river, blog post and CMS page.
 * Sanity only: prices and departures come from Arctic and aren't needed
 * here, so the sitemap never calls it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const docs = await getSitemapDocuments();

    // The two trip-type landing pages and the homepage are static routes,
    // but each renders one Sanity document, so they take its timestamp.
    const updatedAt: Record<string, string | undefined> = {
        '/': docs.homepage?._updatedAt,
    };
    for (const type of docs.tripTypes) {
        if (type.slug) updatedAt[`/${type.slug}`] = type._updatedAt;
    }

    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
        url: absoluteUrl(route),
        ...(updatedAt[route] && { lastModified: updatedAt[route] }),
    }));

    return [
        ...staticEntries,
        ...entries('/trips', docs.trips),
        ...entries('/rivers', docs.rivers),
        ...entries('/blog', docs.posts),
        ...entries(
            '',
            docs.pages.filter(
                (page) => page.slug && !RESERVED_SLUGS.has(page.slug),
            ),
        ),
    ];
}
