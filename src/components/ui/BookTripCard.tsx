import Image from 'next/image';
import Link from 'next/link';
import { DepartureList, VariantTag } from '@/components/ui/DepartureList';
import type { ArcticDeparture } from '@/lib/arctic';
import type { DepartureCalloutMap } from '@/lib/departures';

const PHOTO =
    'object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105';

/** Dates shown per trip before "Show all N dates". */
const PREVIEW_ROWS = 4;

interface BookTripCardProps {
    /** DOM id, the target of trip finder deep links. */
    id: string;
    title: string;
    /** Trip page, for Sanity-mapped trips only. */
    href: string | null;
    /** 16:9 photo, shown on top of the card below lg. */
    imageSrc: string | null;
    /** 4:5 photo for the full-height panel from lg up. */
    panelImageSrc: string | null;
    startingPrice: string | null;
    /** Already checked: never empty or a placeholder. */
    tagline: string | null;
    /** Length tags for the whole trip, shortest first. */
    lengthLabels: string[];
    departures: ArcticDeparture[];
    variantLabels: ReadonlyMap<number, string>;
    callouts?: DepartureCalloutMap;
    /** Show every date instead of the short preview. */
    showAll: boolean;
    /** Preload the photo (first card only). */
    preloadImage?: boolean;
}

/**
 * One trip on /book: a photo big enough to recognize the river, the trip's
 * name, lengths and price, and its next few dates with the rest one click
 * away (NN/g progressive disclosure). Photo on top on small screens, a
 * full-height panel beside the dates from lg up.
 */
export function BookTripCard({
    id,
    title,
    href,
    imageSrc,
    panelImageSrc,
    startingPrice,
    tagline,
    lengthLabels,
    departures,
    variantLabels,
    callouts,
    showAll,
    preloadImage = false,
}: BookTripCardProps) {
    return (
        <article
            id={id}
            data-availability
            // Sand fill and no border, like the photo-first cards on /trips.
            // Row dividers go lighter so they don't compete with the photo.
            className='scroll-mt-6 bg-sand/15 lg:flex [&_li]:border-onyx/12 [&_ul]:border-onyx/12 [[data-demo-sticky-header=on]_&]:scroll-mt-28'
        >
            {imageSrc && panelImageSrc && href && (
                // From lg up the photo fills the card's full height. When
                // "Show all" makes the card tall, the photo stops growing
                // and sticks beside the dates instead of cropping to a
                // sliver.
                <Link
                    href={href}
                    tabIndex={-1}
                    aria-hidden
                    className='group block lg:w-72 lg:shrink-0 xl:w-85'
                >
                    <div className='relative aspect-[16/9] overflow-hidden bg-holiday-grey/15 lg:sticky lg:top-6 lg:aspect-auto lg:h-full lg:max-h-[36rem] lg:min-h-72 [[data-demo-sticky-header=on]_&]:lg:top-24'>
                        {/* Two crops, one per frame shape. The hidden one
                            is display:none, so its lazy image never loads. */}
                        <Image
                            src={imageSrc}
                            alt=''
                            fill
                            preload={preloadImage}
                            className={`${PHOTO} lg:hidden`}
                            sizes='100vw'
                        />
                        <Image
                            src={panelImageSrc}
                            alt=''
                            fill
                            className={`${PHOTO} hidden lg:block`}
                            // Up to 340px wide and 576px tall: cover scales
                            // the 4:5 crop to about 460px wide.
                            sizes='460px'
                        />
                    </div>
                </Link>
            )}
            <div className='min-w-0 flex-1 p-4 sm:p-5 lg:p-6'>
                <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2'>
                    <h2 className='font-alt-gothic text-h3 font-black uppercase leading-h3 text-onyx'>
                        {href ? (
                            <Link
                                href={href}
                                className='transition-opacity hover:opacity-70'
                            >
                                {title}
                            </Link>
                        ) : (
                            title
                        )}
                    </h2>
                    {href && (
                        <Link
                            href={href}
                            className='font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em] text-holiday-red underline transition-opacity hover:opacity-70'
                        >
                            Trip details
                        </Link>
                    )}
                </div>
                {(lengthLabels.length > 0 || startingPrice) && (
                    <div className='mt-3 flex flex-wrap items-center gap-2'>
                        {lengthLabels.map((label) => (
                            <VariantTag key={label} label={label} />
                        ))}
                        {startingPrice && (
                            <span className='ml-1 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em] text-onyx/75'>
                                From {startingPrice}
                            </span>
                        )}
                    </div>
                )}
                {tagline && (
                    <p className='mt-2 max-w-prose text-body leading-body text-onyx'>
                        {tagline}
                    </p>
                )}
                <div className='mt-5'>
                    <DepartureList
                        departures={departures}
                        variantLabels={variantLabels}
                        callouts={callouts}
                        groupByMonth={false}
                        visibleRows={showAll ? Infinity : PREVIEW_ROWS}
                    />
                </div>
            </div>
        </article>
    );
}
