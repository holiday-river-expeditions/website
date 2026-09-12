import Image from 'next/image';
import type { ReactNode } from 'react';

/**
 * The banner every inner page opens with — trip, section, landing, blog
 * post, and Page hero blocks. Same proportions as the homepage hero
 * (Darius, 2026-09-12: inner-page heroes match the homepage now), so the
 * desktop height tracks the 1440:523 banner ratio with a viewport cap
 * instead of a fixed pixel height, and no page reads shorter than home.
 *
 * Text sits bottom-left over a bottom-weighted scrim; the evergreen base
 * keeps white text legible before a photo is set. Pass the crop from
 * `imageUrl(..., PAGE_BANNER_WIDTH, PAGE_BANNER_HEIGHT)` so the request
 * matches the display aspect at 2x.
 */
export const PAGE_BANNER_WIDTH = 2880;
export const PAGE_BANNER_HEIGHT = 1046;

export function PageBanner({
    image,
    imageAlt = '',
    preload = true,
    children,
}: {
    /** Resolved image URL; empty string or undefined = evergreen only. */
    image?: string;
    imageAlt?: string;
    /** Off for a hero block that isn't the first thing on the page. */
    preload?: boolean;
    /** Eyebrow, heading, subline — whatever the page puts over the photo. */
    children: ReactNode;
}) {
    return (
        <section>
            <div className='relative flex h-[460px] items-end overflow-hidden bg-evergreen md:aspect-[1440/523] md:h-auto md:max-h-[75vh]'>
                {image && (
                    <Image
                        src={image}
                        alt={imageAlt}
                        fill
                        preload={preload}
                        className='object-cover'
                        sizes='100vw'
                    />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-onyx/70 via-onyx/10 to-transparent' />
                <div className='relative z-10 w-full px-6 pb-10 md:px-12 md:pb-14'>
                    {children}
                </div>
            </div>
        </section>
    );
}
