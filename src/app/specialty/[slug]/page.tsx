import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AVAILABILITY_ANCHOR } from '@/components/ui/AvailabilitySection';
import { buttonClasses } from '@/components/ui/Button';
import { DepartureList } from '@/components/ui/DepartureList';
import { ItinerarySection } from '@/components/ui/ItinerarySection';
import { LandAcknowledgement } from '@/components/ui/LandAcknowledgement';
import {
    PAGE_BANNER_HEIGHT,
    PAGE_BANNER_WIDTH,
    PageBanner,
} from '@/components/ui/PageBanner';
import { richTextComponents } from '@/components/ui/RichText';
import { Section } from '@/components/ui/Section';
import {
    specialtyDateFacts,
    TripFacts,
    tripFacts,
} from '@/components/ui/TripFacts';
import { getUpcomingDepartures, todayISO } from '@/lib/arctic';
import { getTripTypeFare } from '@/lib/arctic/prices';
import { contactPhone } from '@/lib/contact-defaults';
import {
    departureAnchor,
    durationToDays,
    formatDateRange,
    formatDayLabel,
    parseArcticIds,
    specialtyDatePages,
} from '@/lib/departures';
import {
    getSiteSettings,
    getSpecialtyDateIndex,
    getTripBySlug,
    imageUrl,
} from '@/lib/sanity';
import { openGraphFor } from '@/lib/seo';

// Same ISR window as the trip pages: Studio edits go live within a minute.
export const revalidate = 60;

/** Anchor on the booking block, for the Book button at the page's end. */
const BOOK_ANCHOR = 'book';

interface SpecialtyDatePageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Finds the trip and specialtyDepartures entry behind a page slug. Slugs
 * are worked out in code (see specialtyDateSlug), so this reads the small
 * index of every specialty date, then loads the one trip.
 * specialtyDatePages decides which entry owns a slug, the same list the
 * sitemap is built from.
 */
async function resolveSpecialtyDate(slug: string) {
    const page = specialtyDatePages(await getSpecialtyDateIndex()).find(
        (candidate) => candidate.slug === slug,
    );
    if (!page) return null;
    const trip = await getTripBySlug(page.tripSlug);
    const entry = trip?.specialtyDepartures?.find(
        (candidate) => candidate._key === page.key,
    );
    if (!trip || !entry?.startDate || !entry.label) return null;
    return {
        trip,
        tripSlug: page.tripSlug,
        entry: { ...entry, startDate: entry.startDate, label: entry.label },
    };
}

export async function generateMetadata({
    params,
}: SpecialtyDatePageProps): Promise<Metadata> {
    const { slug } = await params;
    const found = await resolveSpecialtyDate(slug);
    if (!found) return {};
    const { trip, entry } = found;
    const path = `/specialty/${slug}`;
    const photo = entry.image?.asset?._ref ? entry.image : trip.photos?.[0];
    return {
        title: [entry.label, trip.name].filter(Boolean).join(', '),
        description: entry.note ?? trip.tagline ?? undefined,
        alternates: { canonical: path },
        openGraph: openGraphFor(path, photo, photo?.alt),
    };
}

/**
 * One specialty date's own page (Oct 22 sync, decided Nov 16): the band or
 * theme write-up and photo from the trip's specialtyDepartures entry, with
 * the facts, description and itinerary of the river trip it runs on, and
 * booking for that one date. Modelled on the old site's music trip pages.
 * A band that changes rivers next year is a new entry on another trip.
 */
export default async function SpecialtyDatePage({
    params,
}: SpecialtyDatePageProps) {
    const { slug } = await params;
    const [found, settings] = await Promise.all([
        resolveSpecialtyDate(slug),
        getSiteSettings(),
    ]);
    if (!found) notFound();
    const { trip, tripSlug, entry } = found;

    // The same Arctic call the trip page makes, so the two share a cache.
    // Matched by trip type and start date, as on /specialty.
    const today = todayISO();
    const past = entry.startDate < today;
    const typeIds = new Set(parseArcticIds(trip.arcticTripId));
    // A date booked by phone is never looked up: another departure of the
    // trip can start the same day, and its Book button and fare would be
    // for the wrong trip.
    const phoneOnly = entry.phoneOnly === true;
    const departures =
        !past && !phoneOnly && trip.arcticTripId
            ? await getUpcomingDepartures(trip.arcticTripId)
            : null;
    // null means Arctic didn't answer, which is not the same as Arctic
    // answering without this date (AvailabilitySection draws the same line).
    const arcticDown =
        !past &&
        !phoneOnly &&
        Boolean(trip.arcticTripId) &&
        departures === null;
    const departure =
        departures?.find(
            (candidate) =>
                candidate.start === entry.startDate &&
                candidate.triptypeid != null &&
                typeIds.has(candidate.triptypeid),
        ) ?? null;
    const fare =
        departure?.triptypeid != null
            ? await getTripTypeFare(departure.triptypeid)
            : null;
    const days = durationToDays(departure?.duration);

    const phone = contactPhone(settings);
    const family = entry.specialtyType;
    const dateLabel = departure
        ? `${formatDateRange(entry.startDate, departure.duration)}, ${entry.startDate.slice(0, 4)}`
        : formatDayLabel(entry.startDate);

    const ownPhoto = entry.image?.asset?._ref ? entry.image : null;
    const bannerPhoto = ownPhoto ?? trip.photos?.[0];
    const heroPhoto = imageUrl(
        bannerPhoto,
        PAGE_BANNER_WIDTH,
        PAGE_BANNER_HEIGHT,
    );

    const facts = specialtyDateFacts(tripFacts(trip), {
        fare,
        days,
        minAge: entry.minAge,
        priceText: entry.priceText,
        lengthText: entry.lengthText,
    });

    const hasWriteUp = Boolean(entry.body && entry.body.length > 0);
    const hasHighlights = Boolean(
        trip.highlights && trip.highlights.length > 0,
    );

    return (
        <>
            <PageBanner
                image={heroPhoto}
                imageAlt={bannerPhoto?.alt ?? entry.label}
            >
                {family?.name && (
                    <span className='inline-block bg-teal px-3.5 py-1.5 text-[14px] font-bold leading-tight text-holiday-white'>
                        {family.name}
                    </span>
                )}
                <h1 className='mt-3 font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                    {entry.label}
                </h1>
                <p className='mt-2 font-alt-gothic text-subheading font-black uppercase leading-[0.95] text-holiday-white'>
                    {[trip.name, dateLabel].filter(Boolean).join(' · ')}
                </p>
            </PageBanner>

            <Section background='white' className='py-10 md:py-14'>
                {/* Booking for this one date, first on the page. */}
                <div
                    id={BOOK_ANCHOR}
                    className='max-w-4xl scroll-mt-6 border-t border-holiday-grey/40 pt-6'
                >
                    <h2 className='font-alt-gothic text-h3 font-black uppercase leading-h3 text-holiday-red'>
                        Book this date
                    </h2>
                    {departure ? (
                        <div className='mt-2'>
                            <DepartureList
                                departures={[departure]}
                                groupByMonth={false}
                            />
                        </div>
                    ) : (
                        <p className='mt-3 max-w-2xl text-body leading-body text-onyx'>
                            {past
                                ? 'This date has passed.'
                                : phoneOnly
                                  ? 'This date is booked by phone.'
                                  : arcticDown
                                    ? 'Live availability is momentarily unavailable.'
                                    : 'This date is not listed online yet.'}{' '}
                            Call{' '}
                            <a
                                href={`tel:+1${phone.replace(/\D/g, '')}`}
                                className='font-bold text-holiday-red transition-opacity hover:opacity-70'
                            >
                                {phone}
                            </a>{' '}
                            {phoneOnly && !past
                                ? 'to book.'
                                : 'and we will help you find a trip.'}
                        </p>
                    )}
                </div>

                <div className='mt-10'>
                    <TripFacts facts={facts} />
                </div>

                <div className='mt-12 grid gap-12 md:grid-cols-[1.6fr_1fr]'>
                    <div>
                        {/* The band or theme, in Holiday's words. Nothing
                            renders until they write it. */}
                        {hasWriteUp ? (
                            <div className='mb-10 space-y-4 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline'>
                                <PortableText
                                    value={entry.body ?? []}
                                    components={richTextComponents}
                                />
                            </div>
                        ) : (
                            entry.note && (
                                <p className='mb-10 text-paragraph leading-paragraph text-onyx'>
                                    {entry.note}
                                </p>
                            )
                        )}

                        <h2 className='font-alt-gothic text-h3 font-black uppercase leading-h3 text-holiday-red'>
                            The Trip: {trip.name}
                        </h2>
                        {trip.tagline && (
                            <p className='mt-4 text-paragraph font-bold leading-paragraph text-onyx'>
                                {trip.tagline}
                            </p>
                        )}
                        {trip.description && (
                            <div className='mt-6 space-y-4 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline'>
                                <PortableText
                                    value={trip.description}
                                    components={richTextComponents}
                                />
                            </div>
                        )}
                        <LandAcknowledgement body={trip.landAcknowledgement} />
                    </div>

                    {hasHighlights && (
                        <aside>
                            <h2 className='font-alt-gothic text-h3 font-black uppercase leading-h3 text-holiday-red'>
                                Highlights
                            </h2>
                            <ul className='mt-4 space-y-3'>
                                {trip.highlights?.map((highlight) => (
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

            <ItinerarySection days={trip.itinerary ?? []} />

            {/* Ways on from here. The trip page has the rest: photos,
                FAQs, packing and every other date. */}
            <Section background='white' className='pb-20 pt-12 md:pb-24'>
                <div className='flex flex-wrap gap-3 border-y border-holiday-grey/40 py-10'>
                    {departure && (
                        <a href={`#${BOOK_ANCHOR}`} className={buttonClasses()}>
                            Book this date
                        </a>
                    )}
                    <Link
                        href={`/trips/${tripSlug}`}
                        className={buttonClasses({ variant: 'outline' })}
                    >
                        Full trip details
                    </Link>
                    <Link
                        href={`/trips/${tripSlug}#${
                            past || phoneOnly
                                ? AVAILABILITY_ANCHOR
                                : departureAnchor(entry.startDate)
                        }`}
                        className={buttonClasses({ variant: 'outline' })}
                    >
                        See every date
                    </Link>
                    {family?.slug?.current && family.name && (
                        <Link
                            href={`/specialty#${family.slug.current}`}
                            className={buttonClasses({ variant: 'evergreen' })}
                        >
                            More {family.name}
                        </Link>
                    )}
                </div>
            </Section>
        </>
    );
}
