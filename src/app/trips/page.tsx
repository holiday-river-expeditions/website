import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { TripCard } from '@/components/ui/TripCard';
import { getAllTrips, imageUrl } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'All Trips',
    description:
        'Multi-day whitewater rafting and mountain biking expeditions in Utah and Colorado.',
};

export default async function TripsPage() {
    const trips = await getAllTrips();

    return (
        <>
            {/* Page banner */}
            <section className='px-4 pt-3 md:px-10 md:pt-4'>
                <div className='flex items-end bg-evergreen px-6 py-10 md:px-12 md:py-14'>
                    <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                        Explore Our Trips
                    </h1>
                </div>
            </section>

            <Section background='white' className='py-14 md:py-20'>
                {trips.length > 0 ? (
                    <div
                        data-reveal-stagger
                        className='grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                    >
                        {trips.map((trip) => (
                            <TripCard
                                key={trip._id}
                                name={trip.name ?? ''}
                                category={trip.categories?.[0]?.name ?? ''}
                                image={imageUrl(trip.mainImage, 760, 740)}
                                startingPrice={trip.startingPrice ?? ''}
                                duration={trip.durationLabel ?? ''}
                                description={trip.tagline ?? undefined}
                                subtitle={trip.subtitle ?? undefined}
                                ribbon={trip.ribbon ?? undefined}
                                featured={Boolean(trip.ribbon)}
                                difficulty={trip.difficulty ?? undefined}
                                href={
                                    trip.slug?.current
                                        ? `/trips/${trip.slug.current}`
                                        : '#'
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <p className='text-body leading-body text-onyx/70'>
                        Trips are being added — check back soon.
                    </p>
                )}
            </Section>
        </>
    );
}
