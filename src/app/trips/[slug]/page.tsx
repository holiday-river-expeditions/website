import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    AVAILABILITY_ANCHOR,
    AvailabilitySection,
} from '@/components/ui/AvailabilitySection';
import { buttonClasses } from '@/components/ui/Button';
import { ItinerarySection } from '@/components/ui/ItinerarySection';
import { LandAcknowledgement } from '@/components/ui/LandAcknowledgement';
import {
    PAGE_BANNER_HEIGHT,
    PAGE_BANNER_WIDTH,
    PageBanner,
} from '@/components/ui/PageBanner';
import { PhotoGallery } from '@/components/ui/PhotoGallery';
import { RelatedTrips } from '@/components/ui/RelatedTrips';
import { richTextComponents } from '@/components/ui/RichText';
import {
    type GuestReview,
    ReviewsSection,
} from '@/components/ui/ReviewsSection';
import { RiverFlow } from '@/components/ui/RiverFlow';
import { Section } from '@/components/ui/Section';
import { SectionNav } from '@/components/ui/SectionNav';
import type { TripMapPoint } from '@/components/ui/TripMap';
import { TripMapSection } from '@/components/ui/TripMapSection';
import { WhatsIncluded } from '@/components/ui/WhatsIncluded';
import { stretchBySlug } from '@/lib/map-style';
import { getSiteSettings, getTripBySlug, imageUrl } from '@/lib/sanity';
import { TRIP_MAP_COORDS } from '@/lib/trip-map-data';
import { embedUrl } from '@/lib/video';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

interface TripPageProps {
    params: Promise<{ slug: string }>;
}

const RAPID_CLASS_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

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

    const category = trip.tripType?.cardLabel ?? trip.tripType?.name ?? null;
    const heroPhoto = imageUrl(
        trip.photos?.[0],
        PAGE_BANNER_WIDTH,
        PAGE_BANNER_HEIGHT,
    );
    const galleryPhotos = (trip.photos ?? []).slice(1, 9).map((photo) => ({
        key: photo._key,
        src: imageUrl(photo, 1600, 1067),
        alt: photo.alt ?? trip.name ?? '',
        caption: photo.caption,
    }));

    // Rapid class replaces the old difficulty scale (Justin's build-out doc).
    // Trips with no whitewater have no class, so they show who the trip is
    // for in the same slot rather than leaving a gap.
    const rapidClass =
        trip.maxRapidClass && RAPID_CLASS_NUMERALS[trip.maxRapidClass - 1]
            ? `Class ${RAPID_CLASS_NUMERALS[trip.maxRapidClass - 1]}`
            : null;

    const facts: Array<{ label: string; value: string; href?: string }> = [];
    if (trip.startingPrice)
        facts.push({ label: 'Starts at', value: trip.startingPrice });
    if (trip.durationLabel)
        facts.push({ label: 'Duration', value: trip.durationLabel });
    if (rapidClass) {
        facts.push({ label: 'Whitewater', value: rapidClass });
    } else if (trip.whoIsThisFor) {
        facts.push({ label: 'Who it’s for', value: trip.whoIsThisFor });
    }
    if (trip.season) facts.push({ label: 'Season', value: trip.season });
    if (trip.minAge)
        facts.push({ label: 'Min Age', value: String(trip.minAge) });
    if (trip.meetingPlace)
        facts.push({ label: 'Meet at', value: trip.meetingPlace });
    if (trip.deposit) facts.push({ label: 'Deposit', value: trip.deposit });
    if (trip.river?.riverLabel)
        facts.push({
            label: 'River',
            value: trip.river.riverLabel,
            href: trip.river.slug?.current
                ? `/rivers/${trip.river.slug.current}`
                : undefined,
        });

    // Trip map under the highlights: the section's drawn stretch (from
    // the National Hydrography Dataset) and/or the photo points authored
    // on the Section document. A section with neither has nothing to map,
    // so the page goes straight from highlights to the itinerary.
    const mapPoints: TripMapPoint[] = (trip.river?.mapPoints ?? [])
        .filter(
            (point) =>
                point.title &&
                typeof point.location?.lng === 'number' &&
                typeof point.location?.lat === 'number',
        )
        .map((point) => ({
            key: point._key,
            title: point.title ?? '',
            longitude: point.location?.lng ?? 0,
            latitude: point.location?.lat ?? 0,
            imageSrc: imageUrl(point.image, 480, 360) || undefined,
            imageAlt: point.image?.alt ?? undefined,
            caption: point.caption ?? undefined,
        }));
    const sectionSlug = trip.river?.slug?.current;
    const sectionName = trip.river?.name;
    const mapSection =
        sectionSlug &&
        sectionName &&
        (stretchBySlug(sectionSlug) || mapPoints.length > 0) ? (
            <TripMapSection
                sectionSlug={sectionSlug}
                sectionName={sectionName}
                riverLabel={trip.river?.riverLabel}
                center={TRIP_MAP_COORDS[sectionSlug] ?? null}
                points={mapPoints}
            />
        ) : null;

    // A trip-level override replaces the shared body entirely; sections with
    // neither are dropped rather than rendered as an empty panel.
    const infoSections = (trip.infoSections ?? []).flatMap((entry) => {
        const body =
            entry.overrideBody && entry.overrideBody.length > 0
                ? entry.overrideBody
                : entry.section?.body;
        if (!entry.section?.title || !body || body.length === 0) return [];
        return [{ key: entry._key, title: entry.section.title, body }];
    });

    // What's Included is the same on every trip except Desolation (Sep 10
    // decision), so the shared list lives on Site Settings and a trip's
    // own list, when it has one, replaces it outright.
    const includedItems =
        trip.whatsIncluded && trip.whatsIncluded.length > 0
            ? trip.whatsIncluded
            : (settings?.whatsIncluded ?? []);
    const hasHighlights = Boolean(
        trip.highlights && trip.highlights.length > 0,
    );

    // Lead review first, then the rest, for the carousel.
    const reviews: GuestReview[] = [
        trip.featuredReview,
        ...(trip.reviews ?? []),
    ]
        .filter((review) => Boolean(review?.quote))
        .map((review) => ({
            quote: review?.quote ?? '',
            author: review?.author,
            source: review?.source,
        }));

    return (
        <>
            {/* Banner — hero-height (Justin: a larger header image on trip
                pages). */}
            <PageBanner
                image={heroPhoto}
                imageAlt={trip.photos?.[0]?.alt ?? trip.name ?? ''}
            >
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
            </PageBanner>

            {/* Info bar across the top (Riley, Sep 17: trip info, then
                highlights, then map). Justin, Sep 10: 12px labels at a 1.3
                line height with a rule above the bar; the sizing is fixed. */}
            <Section
                id='trip-details'
                background='white'
                className='scroll-mt-6 [[data-demo-sticky-header=on]_&]:scroll-mt-28 py-10 md:py-14'
            >
                <div className='flex flex-wrap items-end justify-between gap-6 border-t border-holiday-grey/40 pt-6'>
                    <dl className='grid w-full grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:w-auto sm:flex-wrap sm:gap-x-10 sm:gap-y-4'>
                        {facts.map((fact) => (
                            <div key={fact.label}>
                                <dt className='font-alt-gothic text-[12px] font-medium uppercase leading-[1.3] tracking-[0.05em] text-onyx/70'>
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
                        {/* Live CFS from USGS; renders nothing without a
                            configured gauge or reading. */}
                        <RiverFlow
                            variant='fact'
                            siteIds={trip.river?.usgsSiteId}
                            href={trip.river?.flowLinkUrl}
                        />
                    </dl>
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

                {/* Description + highlights */}
                <div className='mt-12 grid gap-12 md:grid-cols-[1.6fr_1fr]'>
                    <div>
                        {trip.tagline && (
                            <p className='text-paragraph font-bold leading-paragraph text-onyx'>
                                {trip.tagline}
                            </p>
                        )}
                        {/* No placeholder when empty — an unwritten
                            description should read as a shorter page, not as
                            a note to the editor. */}
                        {trip.description && (
                            <div className='mt-6 space-y-4 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline'>
                                <PortableText
                                    value={trip.description}
                                    components={richTextComponents}
                                />
                            </div>
                        )}
                        {/* Boxed under the trip's own copy, where the current
                            site keeps it. */}
                        <LandAcknowledgement body={trip.landAcknowledgement} />
                    </div>

                    {(hasHighlights || includedItems.length > 0) && (
                        <aside>
                            {hasHighlights && (
                                <div>
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
                                </div>
                            )}
                            {includedItems.length > 0 && (
                                <div
                                    className={
                                        hasHighlights ? 'mt-10' : undefined
                                    }
                                >
                                    <WhatsIncluded items={includedItems} />
                                </div>
                            )}
                        </aside>
                    )}
                </div>

                {/* Trip map, third in the order (Sep 17). Full width so the
                    stretch reads at a glance; the photo points come from
                    the Section document. */}
                {mapSection && <div className='mt-12'>{mapSection}</div>}
            </Section>

            {/* Day-by-day itinerary */}
            <ItinerarySection days={trip.itinerary ?? []} />

            {/* Trip video, above the gallery per Justin's build-out doc */}
            {trip.videoUrl && (
                <Section
                    background='white'
                    className='pb-4 pt-12 md:pb-6 md:pt-16'
                >
                    <div className='mx-auto max-w-4xl'>
                        <div className='relative aspect-video overflow-hidden bg-evergreen'>
                            <iframe
                                src={embedUrl(trip.videoUrl)}
                                title={`${trip.name ?? 'Trip'} video`}
                                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                allowFullScreen
                                loading='lazy'
                                className='absolute inset-0 h-full w-full border-0'
                            />
                        </div>
                    </div>
                </Section>
            )}

            {/* Photo slideshow */}
            <PhotoGallery photos={galleryPhotos} />

            {/* Trip-specific FAQs */}
            {trip.faqs && trip.faqs.length > 0 && (
                <Section
                    id='faqs'
                    background='white'
                    className='scroll-mt-6 [[data-demo-sticky-header=on]_&]:scroll-mt-28 pb-16 pt-12 md:pb-20 md:pt-16'
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
                                            <PortableText
                                                value={faq.answer}
                                                components={richTextComponents}
                                            />
                                        </div>
                                    )}
                                </details>
                            ))}
                        </div>
                    </div>
                </Section>
            )}

            {/* Packing List / Getting Here / Before You Go. Shared documents
                so one edit reaches every trip; a trip that differs overrides
                the body in the Studio. */}
            {infoSections.length > 0 && (
                <Section
                    id='trip-info'
                    background='white'
                    className='scroll-mt-6 [[data-demo-sticky-header=on]_&]:scroll-mt-28 pb-16 pt-12 md:pb-20 md:pt-16'
                >
                    <div className='max-w-3xl'>
                        <div className='divide-y divide-holiday-grey/40 border-y border-holiday-grey/40'>
                            {infoSections.map((entry) => (
                                <details key={entry.key} className='group py-4'>
                                    <summary className='flex cursor-pointer list-none items-center justify-between gap-4 font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-onyx transition-opacity hover:opacity-70 [&::-webkit-details-marker]:hidden'>
                                        {entry.title}
                                        <span
                                            aria-hidden
                                            className='text-holiday-red transition-transform group-open:rotate-45'
                                        >
                                            +
                                        </span>
                                    </summary>
                                    <div className='mt-3 space-y-3 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline'>
                                        <PortableText
                                            value={entry.body}
                                            components={richTextComponents}
                                        />
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </Section>
            )}

            {/* Live availability from Arctic — last, per Justin's build-out
                doc ("Rates and Dates LAST"), so the floating menu's order
                matches the page's. */}
            <AvailabilitySection
                arcticTripId={trip.arcticTripId ?? null}
                specialtyDepartures={trip.specialtyDepartures}
            />

            {/* Reviews carousel + platform links (Aug 20 decision). On the
                page, out of the floating menu. */}
            <ReviewsSection
                reviews={reviews}
                ratingLabel={settings?.reviews?.ratingLabel}
                tripadvisorUrl={settings?.reviews?.tripadvisorUrl}
                googleUrl={settings?.reviews?.googleUrl}
            />

            {/* Cross-sell */}
            <RelatedTrips trips={trip.relatedTrips ?? []} />

            {/* Clearance so the floating menu never permanently occludes
                the last row of content. */}
            <div aria-hidden className='h-16' />

            {/* Floating section menu (Aug 20 decision). Reviews and related
                trips stay on the page but out of the menu. */}
            <SectionNav
                ariaLabel='Trip sections'
                showAfter={0}
                items={[
                    { id: 'trip-details', label: 'Trip Details' },
                    ...(trip.faqs && trip.faqs.length > 0
                        ? [{ id: 'faqs', label: 'FAQs' }]
                        : []),
                    ...(infoSections.length > 0
                        ? [{ id: 'trip-info', label: 'Before You Go' }]
                        : []),
                    { id: AVAILABILITY_ANCHOR, label: 'Rates & Dates' },
                ]}
            />
        </>
    );
}
