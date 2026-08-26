import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import { TripCard } from '@/components/ui/TripCard';
import { getAllSpecialtyTypes, getAllTrips, imageUrl } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Specialty Trips',
    description:
        'Live music in the canyon, dark-sky stargazing, women’s trips, and other one-of-a-kind departures from Holiday River Expeditions.',
};

/**
 * The hub the "Specialty" nav item points at. Per the Aug 20 revision, the
 * per-family parent pages are gone: each family is a section here with its
 * copy, photo, and trips, reachable by jump link (specialty callouts on
 * departure lists deep-link to `/specialty#<slug>`). "View All Trips"
 * expands the full catalog in place instead of navigating away.
 */
export default async function SpecialtyPage() {
    const [types, allTrips] = await Promise.all([
        getAllSpecialtyTypes(),
        getAllTrips(),
    ]);

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
                {types.length > 1 && (
                    <nav aria-label='Specialty trip families' className='mt-8'>
                        <ul className='flex flex-wrap gap-3'>
                            {types.map((type) =>
                                type.slug?.current ? (
                                    <li key={type._id}>
                                        <a
                                            href={`#${type.slug.current}`}
                                            className='inline-block border border-holiday-red px-3.5 py-1.5 text-[14px] font-bold leading-tight text-holiday-red transition-colors hover:bg-holiday-red hover:text-holiday-white'
                                        >
                                            {type.name}
                                        </a>
                                    </li>
                                ) : null,
                            )}
                        </ul>
                    </nav>
                )}
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
                    const photo = imageUrl(type.image, 1200, 700);
                    return (
                        <Section
                            key={type._id}
                            id={type.slug?.current ?? undefined}
                            // Alternating grounds keep a long stack of
                            // families from reading as one undifferentiated
                            // scroll. scroll-mt gives jump links breathing
                            // room at the top of the viewport.
                            background={index % 2 === 0 ? 'white' : 'sand'}
                            className='scroll-mt-6 py-14 md:py-16'
                        >
                            <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-red'>
                                {type.name}
                            </h2>
                            {type.tagline && (
                                <p className='mt-2 max-w-2xl text-paragraph leading-paragraph text-onyx'>
                                    {type.tagline}
                                </p>
                            )}

                            {(type.description || photo) && (
                                <div
                                    className={`mt-8 grid gap-8 ${
                                        type.description && photo
                                            ? 'md:grid-cols-[1.2fr_1fr] md:items-start'
                                            : ''
                                    }`}
                                >
                                    {type.description && (
                                        <div className='max-w-3xl space-y-4 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline'>
                                            <PortableText
                                                value={type.description}
                                            />
                                        </div>
                                    )}
                                    {photo && (
                                        <div className='relative aspect-[16/9] overflow-hidden'>
                                            <Image
                                                src={photo}
                                                alt={type.name ?? ''}
                                                fill
                                                className='object-cover'
                                                sizes='(max-width: 768px) 100vw, 45vw'
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

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
                                <p className='mt-8 max-w-2xl text-body leading-body text-onyx/70'>
                                    Dates for this series are being finalized.
                                    Call{' '}
                                    <a
                                        href='tel:+18012662087'
                                        className='font-bold text-holiday-red transition-opacity hover:opacity-70'
                                    >
                                        801-266-2087
                                    </a>{' '}
                                    to hear what&rsquo;s coming.
                                </p>
                            )}
                        </Section>
                    );
                })
            )}

            {/* Expands in place (Aug 20 decision) rather than bouncing to
                /trips. Native <details> keeps it zero-JS and accessible. */}
            {allTrips.length > 0 && (
                <Section background='white' className='pb-20 pt-4 md:pb-24'>
                    <details className='group'>
                        <summary className='mx-auto block w-fit cursor-pointer list-none border-2 border-holiday-red px-8 py-3 text-center font-alt-gothic text-[18px] font-semibold uppercase tracking-wide text-holiday-red transition-colors hover:bg-holiday-red hover:text-holiday-white [&::-webkit-details-marker]:hidden'>
                            <span className='group-open:hidden'>
                                View All Trips
                            </span>
                            <span className='hidden group-open:inline'>
                                Hide All Trips
                            </span>
                        </summary>
                        <div className='mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3'>
                            {allTrips.map((trip) => (
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
                                    river={trip.river?.name ?? undefined}
                                    href={
                                        trip.slug?.current
                                            ? `/trips/${trip.slug.current}`
                                            : '#'
                                    }
                                />
                            ))}
                        </div>
                    </details>
                </Section>
            )}
        </>
    );
}
