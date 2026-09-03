import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { TripCard, tripCardProps } from '@/components/ui/TripCard';
import { imageUrl } from '@/lib/sanity';
import type { TripTypeBySlugQueryResult } from '@/sanity/types';

interface TripTypeLandingProps {
    tripType: NonNullable<TripTypeBySlugQueryResult>;
}

/**
 * Shared layout for the trip-type landing pages (/rafting, /biking) — the same
 * hero + intro + trip-grid shape as the section detail page. The trip list
 * comes from the query, which also folds in types that list with this one, so
 * combo trips appear under Biking carrying their own tag.
 */
export function TripTypeLanding({ tripType }: TripTypeLandingProps) {
    const heroPhoto = imageUrl(tripType.image, 2560, 900);
    const trips = tripType.trips ?? [];

    return (
        <>
            {/* Banner — inset like the homepage hero */}
            <section>
                <div className='relative flex h-[320px] items-end overflow-hidden bg-evergreen md:h-[440px]'>
                    {heroPhoto && (
                        <Image
                            src={heroPhoto}
                            alt={tripType.name ?? ''}
                            fill
                            priority
                            className='object-cover'
                            sizes='100vw'
                        />
                    )}
                    <div className='absolute inset-0 bg-gradient-to-t from-onyx/70 via-onyx/10 to-transparent' />
                    <div className='relative z-10 w-full px-6 pb-10 md:px-12'>
                        <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                            {tripType.name}
                        </h1>
                    </div>
                </div>
            </section>

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
                    <div className='mt-14 text-center'>
                        <Button href='/trips' variant='outline' size='lg'>
                            View All Trips
                        </Button>
                    </div>
                </Section>
            )}
        </>
    );
}
