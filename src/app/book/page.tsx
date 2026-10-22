import type { Metadata } from 'next';
import Link from 'next/link';
import { BookFilterPanel } from '@/components/ui/BookFilterPanel';
import { BookTripCard } from '@/components/ui/BookTripCard';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import {
    type ArcticDeparture,
    getAllUpcomingDepartures,
    getBookableTripTypes,
} from '@/lib/arctic';
import {
    type BookFilterOption,
    type BookFilters,
    bookHref,
    departureLength,
    facetCounts,
    filterGroups,
    isPlaceholderCopy,
    LENGTH_OPTIONS,
    parseBookFilters,
    tripParam,
} from '@/lib/book-filters';
import {
    buildCalloutMap,
    cleanTypeName,
    type DepartureCalloutMap,
    formatDayLabel,
    groupAnchor,
    monthOptions,
    sortedVariantLabels,
    variantLabelMap,
} from '@/lib/departures';
import { getAllTrips, imageUrl } from '@/lib/sanity';

// Availability changes as reservations come in; regenerate every minute.
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Book Your Trip',
    description:
        'Live availability and booking for upcoming Holiday River Expeditions rafting and mountain biking trips.',
    alternates: { canonical: '/book' },
};

/** Compact identity for a Sanity-authored trip, shown on its card so
    bookers recognize what they're booking (recognition over recall). */
interface TripSummary {
    /** 16:9 crop for the photo on top of the card (below lg). */
    imageSrc: string;
    /** 4:5 crop for the full-height panel beside the dates (lg up). */
    panelImageSrc: string;
    startingPrice: string | null;
    tagline: string | null;
}

interface TripGroup {
    key: string;
    title: string;
    href: string | null;
    departures: ArcticDeparture[];
    /** Specialty callouts for this trip, keyed by departure start date. */
    callouts?: DepartureCalloutMap;
    /** Present only for Sanity-mapped trips; unmapped Arctic types render
        name-only until they're authored (content phase). */
    summary?: TripSummary | null;
    /** Length label per Arctic trip type, from the unfiltered list so tags
        stay put while filters change. */
    variantLabels: Map<number, string>;
}

const phoneLink = (
    <a
        href='tel:+18012662087'
        className='font-bold text-holiday-red transition-opacity hover:opacity-70'
    >
        801-266-2087
    </a>
);

function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** Result count plus the active filters as removable chips (NN/g: show
    applied filters above the results). */
function ResultsSummary({
    filters,
    dates,
    trips,
    labels,
}: {
    filters: BookFilters;
    dates: number;
    trips: number;
    labels: Partial<Record<keyof BookFilters, string>>;
}) {
    const active = (['month', 'days', 'trip'] as const).filter(
        (facet) => filters[facet] !== null,
    );
    return (
        <div className='flex flex-wrap items-center gap-x-4 gap-y-3'>
            <p
                aria-live='polite'
                className='font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.04em] text-onyx'
            >
                {plural(dates, 'date')} on {plural(trips, 'trip')}
            </p>
            {active.length > 0 && (
                <ul className='flex flex-wrap items-center gap-2'>
                    {active.map((facet) => (
                        <li key={facet}>
                            <Link
                                href={bookHref({ ...filters, [facet]: null })}
                                className='inline-flex items-center gap-2 bg-onyx/8 px-3 py-1.5 text-[14px] font-bold text-onyx transition-colors hover:bg-onyx/15'
                            >
                                {labels[facet] ?? filters[facet]}
                                <span aria-hidden>×</span>
                                <span className='sr-only'>(remove filter)</span>
                            </Link>
                        </li>
                    ))}
                    {active.length > 1 && (
                        <li>
                            <Link
                                href='/book'
                                className='px-1 text-[14px] font-bold text-holiday-red underline transition-opacity hover:opacity-70'
                            >
                                Clear all
                            </Link>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}

export default async function BookPage({
    searchParams,
}: {
    searchParams: Promise<{
        month?: string | string[];
        days?: string | string[];
        trip?: string | string[];
    }>;
}) {
    const [departures, tripTypes, sanityTrips, params] = await Promise.all([
        getAllUpcomingDepartures(),
        getBookableTripTypes(),
        getAllTrips(),
        searchParams,
    ]);
    const filters = parseBookFilters(params);

    let groups: TripGroup[] | null = null;
    if (departures !== null && tripTypes !== null) {
        // Public catalog only: keep departures whose trip type has online
        // reservations enabled in Arctic.
        const publicTypes = new Map(tripTypes.map((t) => [t.id, t]));

        // Arctic trip-type id → Sanity trip page, via the arcticTripId field.
        const sanityByTypeId = new Map<
            number,
            {
                name: string;
                slug: string;
                callouts: DepartureCalloutMap;
                summary: TripSummary;
            }
        >();
        for (const trip of sanityTrips) {
            if (!trip.arcticTripId || !trip.slug?.current || !trip.name) {
                continue;
            }
            // Built once per trip and shared across its trip-type ids.
            const callouts = buildCalloutMap(trip.specialtyDepartures);
            const summary: TripSummary = {
                // One crop per frame shape, so Sanity's hotspot picks the
                // framing. Several trip photos are 2250x600 banners, and a
                // single landscape crop stretched up to a tall panel blurs.
                imageSrc: imageUrl(trip.image, 1200, 675),
                panelImageSrc: imageUrl(trip.image, 720, 900),
                startingPrice: trip.startingPrice,
                tagline: isPlaceholderCopy(trip.tagline) ? null : trip.tagline,
            };
            for (const raw of trip.arcticTripId.split(',')) {
                const id = Number(raw.trim());
                if (Number.isInteger(id) && id > 0) {
                    sanityByTypeId.set(id, {
                        name: trip.name,
                        slug: trip.slug.current,
                        callouts,
                        summary,
                    });
                }
            }
        }

        const byGroup = new Map<string, TripGroup>();
        for (const departure of departures) {
            const typeId = departure.triptypeid;
            if (!typeId || !publicTypes.has(typeId)) continue;
            const sanityTrip = sanityByTypeId.get(typeId);
            // Group by Sanity trip page when mapped, else by Arctic type.
            const key = sanityTrip
                ? `sanity:${sanityTrip.slug}`
                : `arctic:${typeId}`;
            let group = byGroup.get(key);
            if (!group) {
                // Sanity is the naming source of truth; unmapped Arctic types
                // fall back to their cleaned online-reservation name. The
                // durable fix is authoring the remaining trips in Sanity
                // (content phase).
                const type = publicTypes.get(typeId);
                group = {
                    key,
                    title:
                        sanityTrip?.name ??
                        cleanTypeName(
                            type?.name ?? departure.name ?? 'Trip',
                            type?.orname,
                        ),
                    href: sanityTrip ? `/trips/${sanityTrip.slug}` : null,
                    departures: [],
                    callouts: sanityTrip?.callouts,
                    summary: sanityTrip?.summary ?? null,
                    variantLabels: new Map(),
                };
                byGroup.set(key, group);
            }
            group.departures.push(departure);
        }

        groups = [...byGroup.values()]
            .map((group) => ({
                ...group,
                variantLabels: variantLabelMap(group.departures, tripTypes),
            }))
            .sort((a, b) =>
                (a.departures[0]?.start ?? '').localeCompare(
                    b.departures[0]?.start ?? '',
                ),
            );
    }

    const allGroups = groups ?? [];
    const visibleGroups = filterGroups(allGroups, filters);
    const visibleDates = visibleGroups.reduce(
        (sum, group) => sum + group.departures.length,
        0,
    );

    // Filter options come from the UNfiltered list so they stay put while
    // a filter is active. Counts apply the other two filters.
    const allDepartures = allGroups.flatMap((group) => group.departures);
    const monthChoices = monthOptions(allDepartures);
    const monthCounts = facetCounts(
        allGroups,
        filters,
        'month',
        monthChoices.map((month) => month.value),
    );
    const months: BookFilterOption[] = monthChoices.map((month) => ({
        ...month,
        count: monthCounts.get(month.value) ?? 0,
    }));

    const presentLengths = new Set(allDepartures.map(departureLength));
    const lengthChoices = LENGTH_OPTIONS.filter((option) =>
        presentLengths.has(option.value),
    );
    const lengthCounts = facetCounts(
        allGroups,
        filters,
        'days',
        lengthChoices.map((option) => option.value),
    );
    const lengths: BookFilterOption[] = lengthChoices.map((option) => ({
        value: option.value,
        label: option.label,
        count: lengthCounts.get(option.value) ?? 0,
    }));

    // Unmapped Arctic types can share a display name; the first date tells
    // them apart in the select.
    const titleCounts = new Map<string, number>();
    for (const group of allGroups) {
        titleCounts.set(group.title, (titleCounts.get(group.title) ?? 0) + 1);
    }
    const tripCounts = facetCounts(
        allGroups,
        filters,
        'trip',
        allGroups.map((group) => tripParam(group.key)),
    );
    const trips: BookFilterOption[] = allGroups
        .map((group) => {
            const first = group.departures[0];
            const ambiguous = (titleCounts.get(group.title) ?? 0) > 1;
            return {
                value: tripParam(group.key),
                label:
                    ambiguous && first
                        ? `${group.title} · ${formatDayLabel(first.start)}`
                        : group.title,
                count: tripCounts.get(tripParam(group.key)) ?? 0,
            };
        })
        .sort((a, b) => a.label.localeCompare(b.label));

    const activeLabels: Partial<Record<keyof BookFilters, string>> = {
        month: months.find((m) => m.value === filters.month)?.label,
        days: lengths.find((l) => l.value === filters.days)?.label,
        trip: trips.find((t) => t.value === filters.trip)?.label,
    };
    const activeCount = Object.values(filters).filter(Boolean).length;
    const panel = (
        <BookFilterPanel
            filters={filters}
            months={months}
            lengths={lengths}
            trips={trips}
        />
    );

    return (
        <>
            <Section background='white' className='pb-4 pt-14 md:pt-20'>
                <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    Book Your Trip
                </h1>
                <p className='mt-4 max-w-2xl text-paragraph leading-paragraph text-onyx'>
                    Live availability on upcoming departures, straight from our
                    reservation system. See one you like? Grab it. Rivers fill
                    up fast.
                </p>
                <p className='mt-3 max-w-2xl text-body leading-body text-onyx'>
                    Rather book with a human? Call {phoneLink},
                    Monday&ndash;Friday, 8am&ndash;5pm Mountain Time.
                </p>
            </Section>

            <Section background='white' className='pb-20 pt-8 md:pb-24'>
                {groups === null ? (
                    <p className='max-w-2xl text-body leading-body text-onyx'>
                        Live availability is momentarily unavailable. Call{' '}
                        {phoneLink} and we&rsquo;ll find you a seat.
                    </p>
                ) : groups.length === 0 ? (
                    <p className='max-w-2xl text-body leading-body text-onyx'>
                        Nothing is listed online right now. Call {phoneLink} to
                        ask about upcoming dates.
                    </p>
                ) : (
                    <div className='lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 xl:gap-12'>
                        {/* Desktop: filters stay in view while 200+ dates
                            scroll past. */}
                        <aside
                            aria-label='Filter dates'
                            className='hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto [[data-demo-sticky-header=on]_&]:lg:top-28 [[data-demo-sticky-header=on]_&]:lg:max-h-[calc(100vh-8rem)]'
                        >
                            {panel}
                        </aside>

                        <div className='min-w-0'>
                            {/* Smaller screens: the same filters behind one
                                button, so the dates start near the top. */}
                            <details className='group mb-5 border border-onyx/25 lg:hidden'>
                                <summary className='flex cursor-pointer list-none items-center justify-between px-4 py-3 font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.04em] text-onyx [&::-webkit-details-marker]:hidden'>
                                    <span>
                                        Filters
                                        {activeCount > 0 && ` (${activeCount})`}
                                    </span>
                                    <span
                                        aria-hidden
                                        className='transition-transform group-open:rotate-180'
                                    >
                                        ↓
                                    </span>
                                </summary>
                                <div className='border-t border-onyx/15 px-4 pb-5 pt-4'>
                                    {panel}
                                </div>
                            </details>

                            <ResultsSummary
                                filters={filters}
                                dates={visibleDates}
                                trips={visibleGroups.length}
                                labels={activeLabels}
                            />

                            {visibleGroups.length === 0 ? (
                                <p className='mt-6 max-w-2xl text-body leading-body text-onyx'>
                                    No dates match these filters.{' '}
                                    <Link
                                        href='/book'
                                        className='font-bold text-holiday-red underline'
                                    >
                                        See all dates
                                    </Link>
                                    .
                                </p>
                            ) : (
                                <div className='mt-6 space-y-8'>
                                    {visibleGroups.map((group, index) => (
                                        <BookTripCard
                                            key={group.key}
                                            id={groupAnchor(group.key)}
                                            title={group.title}
                                            href={group.href}
                                            imageSrc={
                                                group.summary?.imageSrc || null
                                            }
                                            panelImageSrc={
                                                group.summary?.panelImageSrc ||
                                                null
                                            }
                                            startingPrice={
                                                group.summary?.startingPrice ??
                                                null
                                            }
                                            tagline={
                                                group.summary?.tagline ?? null
                                            }
                                            lengthLabels={sortedVariantLabels(
                                                group.variantLabels,
                                            )}
                                            departures={group.departures}
                                            variantLabels={group.variantLabels}
                                            callouts={group.callouts}
                                            showAll={filters.trip !== null}
                                            preloadImage={index === 0}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Section>

            {/* The Book Now CTA lands here, so give browsers who don't see
                their date a path into the full catalog. */}
            <Section background='white' className='pb-20 md:pb-24'>
                <div className='max-w-2xl border-t border-holiday-grey/30 pt-10'>
                    <h2 className='font-alt-gothic text-section font-black uppercase text-onyx'>
                        Not seeing your dates?
                    </h2>
                    <p className='mt-3 text-body leading-body text-onyx'>
                        Browse every trip we run and find the one worth planning
                        around.
                    </p>
                    <div className='mt-6'>
                        <Button href='/trips' variant='outline' size='lg'>
                            Explore All Trips
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
