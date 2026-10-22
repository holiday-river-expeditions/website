import { SITE_NAME } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site-url';

/**
 * schema.org JSON-LD builders. Each one only rearranges data the page has
 * already loaded: no extra Sanity queries and no Arctic calls.
 */

type JsonLd = Record<string, unknown>;

/**
 * A price string as the site shows it ("$1,435") to a number. Anything that
 * isn't a single plain dollar amount ("Call for pricing", "$1,200 to $1,800")
 * returns null, so the offer is left out instead of guessing.
 */
export function parsePrice(value: string | null | undefined): number | null {
    const match = value
        ?.trim()
        .match(/^\$?\s*(\d{1,3}(?:,\d{3})*|\d+)(\.\d{1,2})?$/);
    if (!match) return null;
    const amount = Number(`${match[1].replace(/,/g, '')}${match[2] ?? ''}`);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function provider(): JsonLd {
    return { '@type': 'TravelAgency', name: SITE_NAME, url: absoluteUrl('/') };
}

interface TripJsonLdInput {
    name: string | null | undefined;
    description: string | null | undefined;
    path: string;
    images: string[];
    /** The page's "Starts at" price: Arctic's live price or the Sanity backup. */
    startingPrice: string | null | undefined;
}

/** TouristTrip for a trip page, with an Offer when the price is a plain amount. */
export function tripJsonLd(trip: TripJsonLdInput): JsonLd {
    const url = absoluteUrl(trip.path);
    const price = parsePrice(trip.startingPrice);
    return {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: trip.name ?? undefined,
        description: trip.description ?? undefined,
        url,
        image: trip.images.length > 0 ? trip.images : undefined,
        provider: provider(),
        offers:
            price === null
                ? undefined
                : {
                      '@type': 'Offer',
                      price,
                      priceCurrency: 'USD',
                      url,
                  },
    };
}

interface OrganizationJsonLdInput {
    telephone: string;
    email: string;
    address: string | null | undefined;
    socialLinks: Record<string, string | undefined> | null | undefined;
    image: string | null | undefined;
}

/** TravelAgency for the homepage, from the Site Settings document. */
export function organizationJsonLd(org: OrganizationJsonLdInput): JsonLd {
    const sameAs = Object.values(org.socialLinks ?? {}).filter(
        (link): link is string => Boolean(link?.trim()),
    );
    const address = org.address
        ?.split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(', ');
    return {
        '@context': 'https://schema.org',
        '@type': 'TravelAgency',
        name: SITE_NAME,
        url: absoluteUrl('/'),
        logo: absoluteUrl('/android-chrome-192x192.png'),
        image: org.image || undefined,
        telephone: org.telephone,
        email: org.email,
        address: address || undefined,
        sameAs: sameAs.length > 0 ? sameAs : undefined,
    };
}
