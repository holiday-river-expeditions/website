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
 * When the trip has a clip, it plays full-bleed behind the whole band under a
 * scrim; otherwise the band is the canvas grain alone. No photo ever stands
 * in for the footage.
 */
export function ItinerarySection({
    days,
    media,
}: {
    days: ItineraryDay[];
    media?: ItineraryMedia | null;
}) {
    if (days.length === 0) return null;

    const posterUrl = imageUrl(media?.poster, 1920, 1280);
    // A video with no poster is a black band while it loads, so the poster
    // gates playback too. Without either, the canvas grain is the design —
    // no photo stands in for the footage.
    const videoUrl = posterUrl === '' ? null : (media?.videoUrl ?? null);

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
        <Section
            background='evergreen'
            fullBleed
            className='relative overflow-hidden bg-canvas py-20 md:py-24'
        >
            {videoUrl && (
                <>
                    {/* Poster as the base layer, through next/image for webp
                        negotiation and the editor's hotspot crop. It is what
                        reduced-motion visitors see, so it must stand alone. */}
                    <Image
                        src={posterUrl}
                        alt=''
                        fill
                        className='object-cover'
                        sizes='100vw'
                    />
                    <AmbientVideo src={videoUrl} />
                    {/* The accordion sits directly on the footage, so
                        legibility cannot depend on the clip being dark. This
                        scrim is what guarantees the text contrast — 65% is
                        the point where the water still reads as water and the
                        muted day labels are still legible over whitewater.
                        Lighter than this and the opal day labels wash out;
                        axe cannot catch that, because it measures contrast
                        against the declared background, not video pixels. */}
                    <div
                        aria-hidden
                        className='absolute inset-0 bg-evergreen/65'
                    />
                </>
            )}
            <div className='relative mx-auto max-w-3xl'>{heading}</div>
        </Section>
    );
}
