import { Section } from '@/components/ui/Section';

interface ItineraryDay {
    _key: string;
    day?: string | null;
    title?: string | null;
    description?: string | null;
}

/**
 * Day-by-day sample itinerary as native accordions on an evergreen band —
 * the deep purchase-derisking content from the current site, in the new
 * design language. First day starts open.
 */
export function ItinerarySection({ days }: { days: ItineraryDay[] }) {
    if (days.length === 0) return null;

    return (
        <Section background='evergreen' className='bg-topo py-20 md:py-24'>
            <div className='mx-auto max-w-3xl'>
                <h2
                    data-reveal
                    className='font-alt-gothic text-[36px] font-black uppercase leading-[0.9] text-holiday-white'
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
            </div>
        </Section>
    );
}
