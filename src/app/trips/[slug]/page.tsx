import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    AVAILABILITY_ANCHOR,
    AvailabilitySection,
} from '@/components/ui/AvailabilitySection';
import { buttonClasses } from '@/components/ui/Button';
import { FeaturedReview } from '@/components/ui/FeaturedReview';
import { ItinerarySection } from '@/components/ui/ItinerarySection';
import { RelatedTrips } from '@/components/ui/RelatedTrips';
import { Section } from '@/components/ui/Section';
import { TrustStrip } from '@/components/ui/TrustStrip';
import { getSiteSettings, getTripBySlug, imageUrl } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

interface TripPageProps {
    params: Promise<{ slug: string }>;
}

const difficultyLabels: Record<string, string> = {
    easy: 'Easy',
    moderate: 'Moderate',
    challenging: 'Challenging',
    expert: 'Expert',
};

export async function generateMetadata({
    params,
}: TripPageProps): Promise<Metadata> {
    const { slug } = await params;
    const trip = await getTripBySlug(slug);
    if (!trip) return {};
    return {
        title: trip.name ?? undefined,
        description: trip.tagline ?? undefined,
    };
}

export default async function TripPage({ params }: TripPageProps) {
    const { slug } = await params;
    const [trip, settings] = await Promise.all([
        getTripBySlug(slug),
        getSiteSettings(),
    ]);
    if (!trip) notFound();

    const category = trip.categories?.[0]?.name ?? null;
    const heroPhoto = imageUrl(trip.photos?.[0], 2560, 900);
    const galleryPhotos = (trip.photos ?? []).slice(1, 7);
    const difficulty = trip.difficulty
        ? difficultyLabels[trip.difficulty]
        : null;

    const facts: Array<{ label: string; value: string; href?: string }> = [];
    if (trip.startingPrice)
        facts.push({ label: 'Starts at', value: trip.startingPrice });
    if (trip.durationLabel)
        facts.push({ label: 'Duration', value: trip.durationLabel });
    if (difficulty) facts.push({ label: 'Difficulty', value: difficulty });
    if (trip.season) facts.push({ label: 'Season', value: trip.season });
    if (trip.minAge)
        facts.push({ label: 'Min Age', value: String(trip.minAge) });
    if (trip.river?.name)
        facts.push({
            label: 'River',
            value: trip.river.name,
            href: trip.river.slug?.current
                ? `/rivers/${trip.river.slug.current}`
                : undefined,
        });

    return (
        <>
            {/* Banner — inset like the homepage hero */}
            <section>
                <div className='relative flex h-[320px] items-end overflow-hidden bg-evergreen md:h-[440px]'>
                    {heroPhoto && (
                        <Image
                            src={heroPhoto}
                            alt={trip.photos?.[0]?.alt ?? trip.name ?? ''}
                            fill
                            priority
                            className='object-cover'
                            sizes='100vw'
                        />
                    )}
                    <div className='absolute inset-0 bg-gradient-to-t from-onyx/70 via-onyx/10 to-transparent' />
                    <div className='relative z-10 w-full px-6 pb-10 md:px-12'>
                        {category && (
                            <span className='inline-block bg-teal px-3.5 py-1.5 text-[14px] font-bold leading-tight text-holiday-white'>
                                {category}
                            </span>
                        )}
                        <h1 className='mt-3 font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                            {trip.name}
                        </h1>
                        {trip.subtitle && (
                            <p className='mt-2 font-alt-gothic text-subheading font-black uppercase leading-[0.95] text-holiday-white'>
                                {trip.subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Fact bar */}
            <Section background='white' className='py-8 md:py-10'>
                <div className='flex flex-wrap items-center justify-between gap-6 border-b border-holiday-grey/40 pb-8'>
                    <dl className='grid w-full grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:w-auto sm:flex-wrap sm:gap-x-12 sm:gap-y-4'>
                        {facts.map((fact) => (
                            <div key={fact.label}>
                                <dt className='font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-onyx/70'>
                                    {fact.label}
                                </dt>
                                <dd className='mt-1 font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-holiday-red'>
                                    {fact.href ? (
                                        <Link
                                            href={fact.href}
                                            className='transition-opacity hover:opacity-70'
                                        >
                                            {fact.value}
                                        </Link>
                                    ) : (
                                        fact.value
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <div className='flex flex-wrap items-center gap-3'>
                        {/* Book Now jumps to Dates & Availability on this page
                            (Aug 20 decision). Plain anchor, not Link: a
                            same-page fragment needs native scrolling, not a
                            router navigation. */}
                        <a
                            href={`#${AVAILABILITY_ANCHOR}`}
                            className={buttonClasses({
                                variant: 'primary',
                                size: 'lg',
                            })}
                        >
                            Book Now
                        </a>
                    </div>
                </div>

                {/* Description + highlights */}
                <div className='mt-12 grid gap-12 md:grid-cols-[1.6fr_1fr]'>
                    <div>
                        {trip.tagline && (
                            <p className='text-paragraph font-bold leading-paragraph text-onyx'>
                                {trip.tagline}
                            </p>
                        )}
                        {trip.description ? (
                            <div className='mt-6 space-y-4 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline'>
                                <PortableText value={trip.description} />
                            </div>
                        ) : (
                            <p className='mt-6 text-body leading-body text-onyx/70'>
                                Trip description coming soon. Add it in the
                                Studio.
                            </p>
                        )}
                    </div>

                    {trip.highlights && trip.highlights.length > 0 && (
                        <aside>
                            <h2 className='font-alt-gothic text-h3 font-black uppercase leading-h3 text-holiday-red'>
                                Highlights
                            </h2>
                            <ul className='mt-4 space-y-3'>
                                {trip.highlights.map((highlight) => (
                                    <li
                                        key={highlight}
                                        className='border-l-2 border-holiday-red pl-4 text-body leading-body text-onyx'
                                    >
                                        {highlight}
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    )}
                </div>
            </Section>

            {/* Featured review — social proof before the pitch deepens */}
            {trip.featuredReview?.quote && (
                <FeaturedReview
                    quote={trip.featuredReview.quote}
                    author={trip.featuredReview.author}
                    source={trip.featuredReview.source}
                />
            )}

            {/* Live availability from Arctic */}
            <AvailabilitySection
                arcticTripId={trip.arcticTripId ?? null}
                specialtyDepartures={trip.specialtyDepartures}
            />

            {/* Day-by-day itinerary */}
            <ItinerarySection days={trip.itinerary ?? []} />

            {/* Photo gallery */}
            {galleryPhotos.length > 0 && (
                <Section
                    background='white'
                    className='pb-20 pt-12 md:pb-24 md:pt-16'
                >
                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        {galleryPhotos.map((photo) => (
                            <div
                                key={photo._key}
                                className='relative aspect-[4/3] overflow-hidden bg-holiday-grey/15'
                            >
                                <Image
                                    src={imageUrl(photo, 800, 600)}
                                    alt={photo.alt ?? trip.name ?? ''}
                                    fill
                                    className='object-cover'
                                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                                />
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Trip-specific FAQs */}
            {trip.faqs && trip.faqs.length > 0 && (
                <Section
                    background='white'
                    className='pb-16 pt-12 md:pb-20 md:pt-16'
                >
                    <div className='max-w-3xl'>
                        <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-red'>
                            Good to Know
                        </h2>
                        <div className='mt-6 divide-y divide-holiday-grey/40 border-y border-holiday-grey/40'>
                            {trip.faqs.map((faq) => (
                                <details key={faq._id} className='group py-4'>
                                    <summary className='flex cursor-pointer list-none items-center justify-between gap-4 font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-onyx transition-opacity hover:opacity-70 [&::-webkit-details-marker]:hidden'>
                                        {faq.question}
                                        <span
                                            aria-hidden
                                            className='text-holiday-red transition-transform group-open:rotate-45'
                                        >
                                            +
                                        </span>
                                    </summary>
                                    {faq.answer && (
                                        <div className='mt-3 space-y-3 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline'>
                                            <PortableText value={faq.answer} />
                                        </div>
                                    )}
                                </details>
                            ))}
                        </div>
                    </div>
                </Section>
            )}

            {/* Third-party review trust strip */}
            {settings?.reviews?.ratingLabel &&
                (settings.reviews.tripadvisorUrl ||
                    settings.reviews.googleUrl) && (
                    <TrustStrip
                        ratingLabel={settings.reviews.ratingLabel}
                        tripadvisorUrl={settings.reviews.tripadvisorUrl}
                        googleUrl={settings.reviews.googleUrl}
                    />
                )}

            {/* Cross-sell */}
            <RelatedTrips trips={trip.relatedTrips ?? []} />
        </>
    );
}
