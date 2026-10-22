import Image from 'next/image';
import Link from 'next/link';
import { DepartureList, VariantTag } from '@/components/ui/DepartureList';
import type { ArcticDeparture } from '@/lib/arctic';
import type { DepartureCalloutMap } from '@/lib/departures';

/** Dates shown per trip before "Show all N dates". */
const PREVIEW_ROWS = 4;

interface BookTripCardProps {
    /** DOM id, the target of trip finder deep links. */
    id: string;
    title: string;
    /** Trip page, for Sanity-mapped trips only. */
    href: string | null;
    imageSrc: string | null;
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
 * away (NN/g progressive disclosure). Photo on top on small screens, beside
 * the dates from lg up.
 */
export function BookTripCard({
    id,
    title,
    href,
    imageSrc,
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
            className='scroll-mt-6 border border-onyx/15 bg-holiday-white lg:flex [[data-demo-sticky-header=on]_&]:scroll-mt-28'
        >
            {imageSrc && href && (
                <Link
                    href={href}
                    tabIndex={-1}
                    aria-hidden
                    className='relative block aspect-[16/9] bg-holiday-grey/15 lg:m-5 lg:mr-0 lg:aspect-[4/3] lg:w-60 lg:shrink-0 lg:self-start xl:w-70'
                >
                    <Image
                        src={imageSrc}
                        alt=''
                        fill
                        preload={preloadImage}
                        className='object-cover'
                        sizes='(min-width: 1280px) 280px, (min-width: 1024px) 240px, 100vw'
                    />
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
