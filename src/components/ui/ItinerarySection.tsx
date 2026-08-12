import Image from 'next/image';
import { AmbientVideo } from '@/components/ui/AmbientVideo';
import { Section } from '@/components/ui/Section';
import { imageUrl } from '@/lib/sanity';

interface ItineraryDay {
    _key: string;
    day?: string | null;
    title?: string | null;
    description?: string | null;
}

interface ItineraryMedia {
    videoUrl?: string | null;
    poster?: { asset?: { _ref?: string } } | null;
    alt?: string | null;
}

/**
 * Day-by-day sample itinerary as native accordions on an evergreen band —
 * the deep purchase-derisking content from the current site, in the new
 * design language. First day starts open.
 *
 * When the trip has itinerary media the days sit beside a sticky panel
 * (ambient loop, or the poster on its own); trips with no media keep the
 * original single-column band.
 */
export function ItinerarySection({
    days,
    media,
}: {
    days: ItineraryDay[];
    media?: ItineraryMedia | null;
}) {
    if (days.length === 0) return null;

    const posterUrl = imageUrl(media?.poster, 960, 1280);
    // The poster doubles as the still fallback, so it gates the whole panel:
    // no poster means no media column, whatever else is set.
    const hasPanel = posterUrl !== '';

    const heading = (
        <>
            <h2
                data-reveal
                className='font-alt-gothic text-section font-black uppercase text-holiday-white'
            >
                A Day on the River
            </h2>
            <p className='mt-3 max-w-xl text-body leading-body text-holiday-white/80'>
                A sample itinerary: every trip flexes with the water, the
                weather, and the group. Going with the flow is the point.
            </p>
            <div className='mt-8 divide-y divide-holiday-white/20 border-y border-holiday-white/20'>
                {days.map((item, index) => (
                    <details
                        key={item._key}
                        open={index === 0}
                        className='group py-4'
                    >
                        <summary className='flex cursor-pointer list-none items-baseline justify-between gap-4 [&::-webkit-details-marker]:hidden'>
                            <span className='flex flex-wrap items-baseline gap-x-4'>
                                <span className='font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.1em] text-opal'>
                                    {item.day}
                                </span>
                                <span className='font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-holiday-white'>
                                    {item.title}
                                </span>
                            </span>
                            <span
                                aria-hidden
                                className='text-opal transition-transform group-open:rotate-45'
                            >
                                +
                            </span>
                        </summary>
                        {item.description && (
                            <p className='mt-3 max-w-2xl text-body leading-body text-holiday-white/90'>
                                {item.description}
                            </p>
                        )}
                    </details>
                ))}
            </div>
        </>
    );

    return (
        <Section background='evergreen' className='bg-topo py-20 md:py-24'>
            {hasPanel ? (
                <div className='grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16'>
                    {/* self-start is load-bearing: a stretched grid item fills
                        the row and sticky never engages. */}
                    <div className='lg:sticky lg:top-16 lg:self-start'>
                        <div className='relative aspect-[3/4] overflow-hidden bg-evergreen/60'>
                            {/* The still is always the base layer: it is the
                                poster frame, the reduced-motion fallback, and
                                the no-video fallback all at once — and going
                                through next/image gets webp negotiation and
                                the editor's hotspot crop, which the <video>
                                poster attribute would not. */}
                            <Image
                                src={posterUrl}
                                alt={media?.alt ?? ''}
                                fill
                                className='object-cover'
                                sizes='(max-width: 1024px) 100vw, 40vw'
                            />
                            {media?.videoUrl && (
                                <AmbientVideo src={media.videoUrl} />
                            )}
                        </div>
                    </div>
                    <div>{heading}</div>
                </div>
            ) : (
                <div className='mx-auto max-w-3xl'>{heading}</div>
            )}
        </Section>
    );
}
