import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { absoluteUrl, isIndexable } from '@/lib/site-url';

/**
 * Crawling is allowed only on the launch domain in production (see
 * isIndexable). Everywhere else, including the vercel.app URLs, PR
 * previews and the beta host, robots.txt disallows everything.
 *
 * Reading the request host makes this route render per request instead of
 * at build time. It does no data fetching, so that costs nothing.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
    const host = (await headers()).get('host');

    if (!isIndexable(host)) {
        return { rules: { userAgent: '*', disallow: '/' } };
    }

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/api/', '/arctic-template', '/studio'],
        },
        sitemap: absoluteUrl('/sitemap.xml'),
    };
}
