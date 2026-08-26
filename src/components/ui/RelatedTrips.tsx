import { Section } from '@/components/ui/Section';
import { TripCard } from '@/components/ui/TripCard';
import { imageUrl } from '@/lib/sanity';

interface RelatedTrip {
    _id: string;
    name?: string | null;
    slug?: { current?: string | null } | null;
    tagline?: string | null;
    subtitle?: string | null;
    ribbon?: string | null;
    startingPrice?: string | null;
    durationLabel?: string | null;
    river?: { name?: string | null } | null;
    category?: string | null;
    image?: Parameters<typeof imageUrl>[0];
}

/** "Keep Exploring" cross-sell grid at the bottom of trip pages. */
export function RelatedTrips({ trips }: { trips: RelatedTrip[] }) {
    if (trips.length === 0) return null;

    return (
        <Section background='white' className='py-16 md:py-20'>
            <h2
                data-reveal
                className='font-alt-gothic text-section font-black uppercase text-holiday-red'
            >
                Keep Exploring
            </h2>
            <div
                data-reveal-stagger
                className='mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
            >
                {trips.slice(0, 3).map((trip) => (
                    <TripCard
                        key={trip._id}
                        name={trip.name ?? ''}
                        category={trip.category ?? ''}
                        image={imageUrl(trip.image, 760, 740)}
                        startingPrice={trip.startingPrice ?? ''}
                        duration={trip.durationLabel ?? ''}
                        description={trip.tagline ?? undefined}
                        subtitle={trip.subtitle ?? undefined}
                        ribbon={trip.ribbon ?? undefined}
                        featured={Boolean(trip.ribbon)}
                        river={trip.river?.name ?? undefined}
                        href={
                            trip.slug?.current
                                ? `/trips/${trip.slug.current}`
                                : '#'
                        }
                    />
                ))}
            </div>
        </Section>
    );
}
