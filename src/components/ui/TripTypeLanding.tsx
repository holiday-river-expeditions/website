import { Section } from '@/components/ui/Section';
import {
    PAGE_BANNER_HEIGHT,
    PAGE_BANNER_WIDTH,
    PageBanner,
} from '@/components/ui/PageBanner';
import { TripCard, tripCardProps } from '@/components/ui/TripCard';
import { TripCatalogDisclosure } from '@/components/ui/TripCatalogDisclosure';
import { imageUrl } from '@/lib/sanity';
import type {
    AllTripsQueryResult,
    TripTypeBySlugQueryResult,
} from '@/sanity/types';

interface TripTypeLandingProps {
    tripType: NonNullable<TripTypeBySlugQueryResult>;
    /** The whole catalog, for the in-place "View All Trips" expansion. */
    allTrips: AllTripsQueryResult;
}

/**
 * Shared layout for the trip-type landing pages (/rafting, /biking) — the same
 * hero + intro + trip-grid shape as the section detail page. The trip list
 * comes from the query, which also folds in types that list with this one, so
 * combo trips appear under Biking carrying their own tag.
 */
export function TripTypeLanding({ tripType, allTrips }: TripTypeLandingProps) {
    const heroPhoto = imageUrl(
        tripType.image,
        PAGE_BANNER_WIDTH,
        PAGE_BANNER_HEIGHT,
    );
    const trips = tripType.trips ?? [];
    // "View All Trips" opens the rest of the catalog in place rather than
    // bouncing to /trips (Justin's build-out doc), so only the trips not
    // already on the page are behind it.
    const shown = new Set(trips.map((trip) => trip._id));
    const moreTrips = allTrips.filter((trip) => !shown.has(trip._id));

    return (
        <>
            <PageBanner image={heroPhoto} imageAlt={tripType.name ?? ''}>
                <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                    {tripType.name}
                </h1>
            </PageBanner>

            {/* Description */}
            {tripType.description && (
                <Section background='white' className='py-12 md:py-16'>
                    <p className='max-w-3xl text-paragraph leading-paragraph text-onyx'>
                        {tripType.description}
                    </p>
                </Section>
            )}

            {/* Trips of this type */}
            {trips.length > 0 && (
                <Section
                    background='white'
                    className={`pb-20 md:pb-24 ${
                        tripType.description ? 'pt-0' : 'pt-12 md:pt-16'
                    }`}
                >
                    <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-red'>
                        {tripType.name} Trips
                    </h2>
                    <div
                        data-reveal-stagger
                        className='mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                    >
                        {trips.map((trip) => (
                            <TripCard key={trip._id} {...tripCardProps(trip)} />
                        ))}
                    </div>
                    <div className='mt-14'>
                        <TripCatalogDisclosure
                            trips={moreTrips}
                            heading='More Trips'
                            hideLabel='Hide Other Trips'
                        />
                    </div>
                </Section>
            )}
        </>
    );
}
