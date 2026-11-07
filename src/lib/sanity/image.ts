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

/** Width of the blurred stand-in. Small enough to arrive in one round trip
    (well under 1KB), wide enough that the browser's upscaling stays smooth. */
const PLACEHOLDER_WIDTH = 32;

/**
 * A tiny blurred copy of the same crop `imageUrl(source, width, height)`
 * produces, to sit under the full image while it loads. Same hotspot and
 * aspect, so the sharp photo lands exactly where its blur was. Returns ''
 * when there's no image.
 */
export function placeholderUrl(
    source: { asset?: { _ref?: string } } | null | undefined,
    width: number,
    height: number,
): string {
    if (!source?.asset?._ref) return '';
    return urlFor(source as SanityImageSource)
        .width(PLACEHOLDER_WIDTH)
        .height(Math.max(1, Math.round((PLACEHOLDER_WIDTH * height) / width)))
        .fit('crop')
        .blur(10)
        .quality(40)
        .auto('format')
        .url();
}
