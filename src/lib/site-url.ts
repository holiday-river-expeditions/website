/**
 * One place for the site's public origin. metadataBase, canonical URLs, the
 * sitemap, robots.txt, JSON-LD and the Arctic design template all build
 * absolute URLs from here.
 *
 * NEXT_PUBLIC_SITE_URL is empty until the domain cutover, so everything falls
 * back to the Vercel production URL. At cutover it becomes
 * https://holidayriver.com (docs/project/environments.md).
 */

/** The launch domain. Apex is canonical; www redirects to it. */
export const PRODUCTION_SITE_URL = 'https://holidayriver.com';

/** Where production lives until the cutover. */
export const FALLBACK_SITE_URL = 'https://website-phi-six-25.vercel.app';

type Env = Record<string, string | undefined>;

/** The site origin with no trailing slash. */
export function getSiteUrl(env: Env = process.env): string {
    // || (not ??): the env var exists but is empty in some environments, and
    // an empty base would silently produce relative URLs.
    return (env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, '');
}

/** Absolute URL for a site path such as "/trips/cataract-canyon". */
export function absoluteUrl(path: string, env: Env = process.env): string {
    const suffix = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
    return `${getSiteUrl(env)}${suffix}`;
}

/**
 * Whether search engines may crawl this request. Only true for the
 * production deployment, configured for the launch domain, and reached on
 * the launch domain itself. The vercel.app URLs, PR previews and the beta
 * host all stay disallowed, including the vercel.app alias of the
 * production deployment after cutover.
 */
export function isIndexable(host: string | null, env: Env = process.env) {
    if (env.VERCEL_ENV !== 'production') return false;
    const launch = new URL(PRODUCTION_SITE_URL);
    let configured: URL;
    try {
        configured = new URL(getSiteUrl(env));
    } catch {
        return false;
    }
    if (configured.origin !== launch.origin) return false;
    const requestHost = host?.split(':')[0].trim().toLowerCase();
    return requestHost === launch.hostname;
}
