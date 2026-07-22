import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';
import { client } from './client';

const builder = createImageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
    return builder.image(source);
}

/**
 * Build a CDN URL for a Sanity image, cropped to the requested box (honoring
 * the editor's hotspot). Returns '' when the image hasn't been uploaded yet so
 * callers can show a neutral placeholder instead of a broken image.
 */
export function imageUrl(
    source: { asset?: { _ref?: string } } | null | undefined,
    width: number,
    height?: number,
): string {
    if (!source?.asset?._ref) return '';
    let b = urlFor(source as SanityImageSource)
        .width(width)
        .fit('crop')
        .auto('format');
    if (height) b = b.height(height);
    return b.url();
}
