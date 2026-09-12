import { buttonClasses } from '@/components/ui/Button';
import {
    TripCard,
    tripCardProps,
    type TripCardSource,
} from '@/components/ui/TripCard';

interface CatalogTrip extends TripCardSource {
    _id: string;
}

/**
 * "View All Trips" that expands in place (Aug 20 decision) rather than
 * bouncing to /trips. A native <details> keeps it zero-JS and accessible;
 * the summary wears the outline button so it matches every other outline
 * CTA. Shared by the specialty hub and the rafting/biking landing pages.
 */
export function TripCatalogDisclosure({
    trips,
    heading,
    hideLabel = 'Hide All Trips',
}: {
    trips: CatalogTrip[];
    /** Optional heading above the revealed grid. */
    heading?: string;
    hideLabel?: string;
}) {
    if (trips.length === 0) return null;

    return (
        <details className='group'>
            <summary
                className={buttonClasses({
                    variant: 'outline',
                    size: 'lg',
                    display: 'block',
                    className:
                        'mx-auto w-fit cursor-pointer list-none text-center [&::-webkit-details-marker]:hidden',
                })}
            >
                <span className='group-open:hidden'>View All Trips</span>
                <span className='hidden group-open:inline'>{hideLabel}</span>
            </summary>
            {heading && (
                <h2 className='mt-12 font-alt-gothic text-section font-black uppercase text-holiday-red'>
                    {heading}
                </h2>
            )}
            <div
                className={`grid gap-10 sm:grid-cols-2 lg:grid-cols-3 ${
                    heading ? 'mt-10' : 'mt-12'
                }`}
            >
                {trips.map((trip) => (
                    <TripCard key={trip._id} {...tripCardProps(trip)} />
                ))}
            </div>
        </details>
    );
}
