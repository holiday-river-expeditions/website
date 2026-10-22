import type { Metadata } from 'next';
import { imageUrl } from '@/lib/sanity';

export const SITE_NAME = 'Holiday River Expeditions';

/** Open Graph's recommended share card size. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * Site-wide Open Graph defaults. Next merges metadata shallowly, so a page
 * that sets its own `openGraph` replaces these entirely. Pages build theirs
 * with `openGraphFor`, which spreads these back in.
 */
export const DEFAULT_OPEN_GRAPH = {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
} satisfies Metadata['openGraph'];

export const DEFAULT_TWITTER = {
    card: 'summary_large_image',
} satisfies Metadata['twitter'];

type SanityImage = Parameters<typeof imageUrl>[0];

/**
 * Per-page Open Graph block: the site defaults, the page's canonical path,
 * and its Sanity hero image cropped to the share card size. Title and
 * description are left out on purpose: Next fills them from the page's own
 * metadata, with the title template applied.
 */
export function openGraphFor(
    path: string,
    image: SanityImage,
    alt?: string | null,
): NonNullable<Metadata['openGraph']> {
    const url = imageUrl(image, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT);
    return {
        ...DEFAULT_OPEN_GRAPH,
        url: path,
        ...(url && {
            images: [
                {
                    url,
                    width: OG_IMAGE_WIDTH,
                    height: OG_IMAGE_HEIGHT,
                    ...(alt && { alt }),
                },
            ],
        }),
    };
}
