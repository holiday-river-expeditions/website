import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { TripCard } from '@/components/ui/TripCard';
import { getAllSpecialtyTypes, imageUrl } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Specialty Trips',
    description:
        'Live music in the canyon, dark-sky stargazing, women’s trips, and other one-of-a-kind departures from Holiday River Expeditions.',
};

/**
 * The hub the "Specialty" nav item points at: every specialty family, each
 * with its trips. Families with no trips authored yet still render as a card
 * so the parent page stays reachable while content lands.
 */
export default async function SpecialtyPage() {
    const types = await getAllSpecialtyTypes();

    return (
        <>
            <Section background='white' className='pb-4 pt-14 md:pt-20'>
                <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    Specialty Trips
                </h1>
                <p className='mt-4 max-w-2xl text-paragraph leading-paragraph text-onyx'>
                    Some trips are the river plus something else — a bluegrass
                    band on the beach, a new moon over the canyon rim, a boat
                    full of people who came for the same reason you did.
                </p>
            </Section>

            {types.length === 0 ? (
                <Section background='white' className='pb-20 pt-8 md:pb-24'>
                    <p className='max-w-2xl text-body leading-body text-onyx/70'>
                        Specialty trips are being added. In the meantime,{' '}
                        <Link
                            href='/trips'
                            className='font-bold text-holiday-red underline'
                        >
                            browse every trip
                        </Link>
                        .
                    </p>
                </Section>
            ) : (
                types.map((type, index) => {
                    const trips = type.trips ?? [];
                    const slug = type.slug?.current;
                    const heroPhoto = imageUrl(type.image, 1200, 700);
                    return (
                        <Section
                            key={type._id}
                            // Alternating grounds keep a long stack of
                            // families from reading as one undifferentiated
                            // scroll.
                            background={index % 2 === 0 ? 'white' : 'sand'}
                            className='py-14 md:py-16'
                        >
                            <div className='flex flex-wrap items-end justify-between gap-x-8 gap-y-4'>
                                <div>
                                    <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-red'>
                                        {slug ? (
                                            <Link
                                                href={`/specialty/${slug}`}
                                                className='transition-opacity hover:opacity-70'
                                            >
                                                {type.name}
                                            </Link>
                                        ) : (
                                            type.name
                                        )}
                                    </h2>
                                    {type.tagline && (
                                        <p className='mt-2 max-w-2xl text-paragraph leading-paragraph text-onyx'>
                                            {type.tagline}
                                        </p>
                                    )}
                                </div>
                                {slug && (
                                    <Button
                                        href={`/specialty/${slug}`}
                                        variant='outline'
                                    >
                                        About These Trips
                                    </Button>
                                )}
                            </div>

                            {trips.length > 0 ? (
                                <div
                                    data-reveal-stagger
                                    className='mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                                >
                                    {trips.map((trip) => (
                                        <TripCard
                                            key={trip._id}
                                            name={trip.name ?? ''}
                                            category={trip.category ?? ''}
                                            image={imageUrl(
                                                trip.image,
                                                760,
                                                740,
                                            )}
                                            startingPrice={
                                                trip.startingPrice ?? ''
                                            }
                                            duration={trip.durationLabel ?? ''}
                                            description={
                                                trip.tagline ?? undefined
                                            }
                                            subtitle={
                                                trip.subtitle ?? undefined
                                            }
                                            ribbon={trip.ribbon ?? undefined}
                                            featured={Boolean(trip.ribbon)}
                                            river={
                                                trip.river?.name ?? undefined
                                            }
                                            href={
                                                trip.slug?.current
                                                    ? `/trips/${trip.slug.current}`
                                                    : '#'
                                            }
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className='mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-center'>
                                    <p className='text-body leading-body text-onyx/70'>
                                        Dates for this series are being
                                        finalized. Call{' '}
                                        <a
                                            href='tel:+18012662087'
                                            className='font-bold text-holiday-red transition-opacity hover:opacity-70'
                                        >
                                            801-266-2087
                                        </a>{' '}
                                        to hear what&rsquo;s coming.
                                    </p>
                                    {heroPhoto && (
                                        <div className='relative aspect-[16/9] overflow-hidden'>
                                            <Image
                                                src={heroPhoto}
                                                alt={type.name ?? ''}
                                                fill
                                                className='object-cover'
                                                sizes='(max-width: 768px) 100vw, 55vw'
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </Section>
                    );
                })
            )}

            <Section background='white' className='pb-20 pt-4 md:pb-24'>
                <div className='text-center'>
                    <Button href='/trips' variant='outline' size='lg'>
                        View All Trips
                    </Button>
                </div>
            </Section>
        </>
    );
}
