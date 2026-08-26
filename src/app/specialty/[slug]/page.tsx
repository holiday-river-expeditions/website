import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AVAILABILITY_ANCHOR } from '@/components/ui/AvailabilitySection';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { TripCard } from '@/components/ui/TripCard';
import { formatDayLabel } from '@/lib/departures';
import { getSpecialtyTypeBySlug, imageUrl } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

interface SpecialtyPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({
    params,
}: SpecialtyPageProps): Promise<Metadata> {
    const { slug } = await params;
    const type = await getSpecialtyTypeBySlug(slug);
    if (!type) return {};
    return {
        title: type.name ?? undefined,
        description: type.tagline ?? undefined,
    };
}

/**
 * Parent page for one specialty family — the replacement for the legacy
 * site's specialty URL parents (docs/project/site-audit.md).
 *
 * The "Upcoming Dates" list comes from Sanity's authored specialtyDepartures
 * rather than Arctic: these are the dates Holiday has designated as this
 * family's, and rendering them here needs no reservation-system call. Live
 * seat counts stay one click away on each trip page.
 */
export default async function SpecialtyTypePage({
    params,
}: SpecialtyPageProps) {
    const { slug } = await params;
    const type = await getSpecialtyTypeBySlug(slug);
    if (!type) notFound();

    const heroPhoto = imageUrl(type.image, 2560, 900);
    const trips = type.trips ?? [];

    // Authored dates across every trip in this family, future-only and in
    // chronological order. Compared as YYYY-MM-DD strings, which sort
    // lexicographically — no Date parsing and no timezone to get wrong.
    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Denver',
    }).format(new Date());
    const upcoming = trips
        .flatMap((trip) =>
            (trip.specialtyDepartures ?? []).map((departure) => ({
                ...departure,
                tripName: trip.name,
                tripSlug: trip.slug?.current ?? null,
            })),
        )
        .filter(
            (departure) => departure.startDate && departure.startDate >= today,
        )
        .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));

    return (
        <>
            {/* Banner — inset like the homepage hero */}
            <section>
                <div className='relative flex h-[320px] items-end overflow-hidden bg-evergreen md:h-[440px]'>
                    {heroPhoto && (
                        <Image
                            src={heroPhoto}
                            alt={type.name ?? ''}
                            fill
                            priority
                            className='object-cover'
                            sizes='100vw'
                        />
                    )}
                    <div className='absolute inset-0 bg-gradient-to-t from-onyx/70 via-onyx/10 to-transparent' />
                    <div className='relative z-10 w-full px-6 pb-10 md:px-12'>
                        <Link
                            href='/specialty'
                            className='inline-block bg-holiday-red px-3.5 py-1.5 text-[14px] font-bold leading-tight text-holiday-white transition-opacity hover:opacity-80'
                        >
                            Specialty Trips
                        </Link>
                        <h1 className='mt-3 font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                            {type.name}
                        </h1>
                        {type.tagline && (
                            <p className='mt-2 max-w-3xl font-alt-gothic text-subheading font-black uppercase leading-[0.95] text-holiday-white'>
                                {type.tagline}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Description */}
            <Section background='white' className='py-12 md:py-16'>
                {type.description ? (
                    <div className='max-w-3xl space-y-4 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline'>
                        <PortableText value={type.description} />
                    </div>
                ) : (
                    <p className='max-w-3xl text-body leading-body text-onyx/70'>
                        Description coming soon. Add it in the Studio.
                    </p>
                )}
            </Section>

            {/* Dates Holiday has designated as this family's */}
            {upcoming.length > 0 && (
                <Section background='sand' className='py-14 md:py-16'>
                    <div className='max-w-4xl'>
                        <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-red'>
                            Upcoming Dates
                        </h2>
                        <ul className='mt-6 divide-y divide-onyx/15 border-y border-onyx/15'>
                            {upcoming.map((departure) => (
                                <li
                                    key={`${departure.tripSlug}-${departure._key}`}
                                    className='grid grid-cols-1 items-center gap-x-6 gap-y-2 py-4 sm:grid-cols-[minmax(180px,auto)_1fr_auto]'
                                >
                                    <span className='font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-onyx'>
                                        {formatDayLabel(
                                            departure.startDate ?? '',
                                        )}
                                    </span>
                                    <span className='text-body leading-body text-onyx'>
                                        <span className='font-bold'>
                                            {departure.label}
                                        </span>
                                        {departure.tripName && (
                                            <span className='text-onyx/70'>
                                                {' · '}
                                                {departure.tripName}
                                            </span>
                                        )}
                                        {departure.note && (
                                            <span className='mt-1 block text-onyx/80'>
                                                {departure.note}
                                            </span>
                                        )}
                                    </span>
                                    {departure.tripSlug && (
                                        <Button
                                            href={`/trips/${departure.tripSlug}#${AVAILABILITY_ANCHOR}`}
                                            variant='outline'
                                            className='justify-self-start sm:justify-self-end'
                                        >
                                            See Seats
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </Section>
            )}

            {/* Trips in this family */}
            {trips.length > 0 && (
                <Section background='white' className='py-14 md:py-16'>
                    <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-red'>
                        {type.name} Trips
                    </h2>
                    <div
                        data-reveal-stagger
                        className='mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                    >
                        {trips.map((trip) => (
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
            )}

            <Section background='white' className='pb-20 pt-0 md:pb-24'>
                <div className='text-center'>
                    <Button href='/specialty' variant='outline' size='lg'>
                        All Specialty Trips
                    </Button>
                </div>
            </Section>
        </>
    );
}
