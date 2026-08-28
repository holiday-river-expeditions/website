import { Section } from '@/components/ui/Section';
import {
    TripCard,
    tripCardProps,
    type TripCardSource,
} from '@/components/ui/TripCard';

interface RelatedTrip extends TripCardSource {
    _id: string;
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
                    <TripCard key={trip._id} {...tripCardProps(trip)} />
                ))}
            </div>
        </Section>
    );
}
