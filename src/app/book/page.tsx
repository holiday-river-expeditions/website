import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { DepartureList } from '@/components/ui/DepartureList';
import {
    DepartureFilterBar,
    type FilterBarTrip,
} from '@/components/ui/DepartureFilterBar';
import { Section } from '@/components/ui/Section';
import {
    type ArcticDeparture,
    getAllUpcomingDepartures,
    getBookableTripTypes,
} from '@/lib/arctic';
import {
    buildCalloutMap,
    cleanTypeName,
    type DepartureCalloutMap,
    filterByMonth,
    formatDateRange,
    formatDayLabel,
    monthOptions,
    nextAvailable,
    parseMonthParam,
} from '@/lib/departures';
import { getAllTrips, imageUrl } from '@/lib/sanity';

// Availability changes as reservations come in; regenerate every minute.
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Book Your Trip',
    description:
        'Live availability and booking for upcoming Holiday River Expeditions rafting and mountain biking trips.',
};

/** Compact identity for a Sanity-authored trip, shown at the group header
    so bookers recognize what they're booking (recognition over recall). */
interface TripSummary {
    imageSrc: string;
    startingPrice: string | null;
    durationLabel: string | null;
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
}

/** Group key ("sanity:cataract-canyon" / "arctic:123") → DOM-safe anchor id
    for the floating menu. */
function groupAnchor(key: string): string {
    return `trip-${key.replace(/[^a-zA-Z0-9-]/g, '-')}`;
}

export default async function BookPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string | string[] }>;
}) {
    const [departures, tripTypes, sanityTrips, params] = await Promise.all([
        getAllUpcomingDepartures(),
        getBookableTripTypes(),
        getAllTrips(),
        searchParams,
    ]);
    const activeMonth = parseMonthParam(params.month);

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
                imageSrc: imageUrl(trip.mainImage, 320, 320),
                startingPrice: trip.startingPrice,
                durationLabel: trip.durationLabel,
                tagline: trip.tagline,
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
                };
                byGroup.set(key, group);
            }
            group.departures.push(departure);
        }

        groups = [...byGroup.values()].sort((a, b) =>
            (a.departures[0]?.start ?? '').localeCompare(
                b.departures[0]?.start ?? '',
            ),
        );
    }

    // Filter-bar data comes from the UNfiltered groups so the month chips
    // and trip jumper stay stable while a filter is active.
    const months = groups
        ? monthOptions(groups.flatMap((group) => group.departures)).map(
              (month) => ({
                  ...month,
                  count: groups!.reduce(
                      (sum, group) =>
                          sum +
                          filterByMonth(group.departures, month.value).length,
                      0,
                  ),
              }),
          )
        : [];
    const visibleGroups =
        groups === null || activeMonth === null
            ? groups
            : groups
                  .map((group) => ({
                      ...group,
                      departures: filterByMonth(group.departures, activeMonth),
                  }))
                  .filter((group) => group.departures.length > 0);

    // The jumper offers only groups actually on the page — under a month
    // filter, absent groups have no anchor to jump to.
    const titleCounts = new Map<string, number>();
    for (const group of visibleGroups ?? []) {
        titleCounts.set(group.title, (titleCounts.get(group.title) ?? 0) + 1);
    }
    const jumpTrips: FilterBarTrip[] = (visibleGroups ?? []).map((group) => {
        const next = nextAvailable(group.departures);
        // Unmapped Arctic types can share a display name; the next date
        // tells them apart in the jumper.
        const ambiguous = (titleCounts.get(group.title) ?? 0) > 1;
        return {
            id: groupAnchor(group.key),
            label:
                ambiguous && next
                    ? `${group.title} · ${formatDayLabel(next.start)}`
                    : group.title,
        };
    });

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
                    Rather book with a human? Call{' '}
                    <a
                        href='tel:+18012662087'
                        className='font-bold text-holiday-red transition-opacity hover:opacity-70'
                    >
                        801-266-2087
                    </a>
                    , Monday&ndash;Friday, 8am&ndash;5pm Mountain Time.
                </p>
            </Section>

            <Section background='white' className='pb-20 pt-8 md:pb-24'>
                {groups === null ? (
                    <p className='max-w-2xl text-body leading-body text-onyx'>
                        Live availability is momentarily unavailable. Call{' '}
                        <a
                            href='tel:+18012662087'
                            className='font-bold text-holiday-red transition-opacity hover:opacity-70'
                        >
                            801-266-2087
                        </a>{' '}
                        and we&rsquo;ll find you a seat.
                    </p>
                ) : visibleGroups!.length === 0 ? (
                    activeMonth !== null && groups.length > 0 ? (
                        <p className='max-w-2xl text-body leading-body text-onyx'>
                            No departures in that month.{' '}
                            <Link
                                href='/book'
                                className='font-bold text-holiday-red underline'
                            >
                                See all dates
                            </Link>
                            .
                        </p>
                    ) : (
                        <p className='max-w-2xl text-body leading-body text-onyx'>
                            Nothing is listed online right now. Call{' '}
                            <a
                                href='tel:+18012662087'
                                className='font-bold text-holiday-red transition-opacity hover:opacity-70'
                            >
                                801-266-2087
                            </a>{' '}
                            to ask about upcoming dates.
                        </p>
                    )
                ) : (
                    <div className='max-w-4xl space-y-14'>
                        {visibleGroups!.map((group) => {
                            const next = nextAvailable(group.departures);
                            return (
                                <div
                                    key={group.key}
                                    id={groupAnchor(group.key)}
                                    className='scroll-mt-6'
                                    data-availability
                                >
                                    {/* Group header: for authored trips a
                                        compact identity card (photo, price,
                                        duration, tagline, details link) so
                                        bookers recognize what they're
                                        booking; name-only otherwise. */}
                                    <div className='flex items-start gap-5'>
                                        {group.summary?.imageSrc &&
                                            group.href && (
                                                <Link
                                                    href={group.href}
                                                    tabIndex={-1}
                                                    aria-hidden
                                                    className='relative hidden h-24 w-24 shrink-0 overflow-hidden bg-holiday-grey/15 sm:block'
                                                >
                                                    <Image
                                                        src={
                                                            group.summary
                                                                .imageSrc
                                                        }
                                                        alt=''
                                                        fill
                                                        className='object-cover'
                                                        sizes='96px'
                                                    />
                                                </Link>
                                            )}
                                        <div className='min-w-0'>
                                            <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
                                                <h2 className='font-alt-gothic text-section font-black uppercase text-onyx'>
                                                    {group.href ? (
                                                        <Link
                                                            href={group.href}
                                                            className='transition-opacity hover:opacity-70'
                                                        >
                                                            {group.title}
                                                        </Link>
                                                    ) : (
                                                        group.title
                                                    )}
                                                </h2>
                                                {next && (
                                                    <span className='inline-block bg-teal px-3.5 py-1.5 text-[14px] font-bold leading-tight text-holiday-white'>
                                                        Next:{' '}
                                                        {formatDateRange(
                                                            next.start,
                                                            next.duration,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            {group.summary?.tagline && (
                                                <p className='mt-1.5 max-w-prose text-body leading-body text-onyx'>
                                                    {group.summary.tagline}
                                                </p>
                                            )}
                                            {group.summary && (
                                                <p className='mt-1.5 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em] text-onyx/75'>
                                                    {[
                                                        group.summary
                                                            .startingPrice &&
                                                            `Starts at ${group.summary.startingPrice}`,
                                                        group.summary
                                                            .durationLabel,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                    {group.href && (
                                                        <>
                                                            {' · '}
                                                            <Link
                                                                href={
                                                                    group.href
                                                                }
                                                                className='text-holiday-red underline transition-opacity hover:opacity-70'
                                                            >
                                                                Trip details
                                                            </Link>
                                                        </>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className='mt-5'>
                                        <DepartureList
                                            departures={group.departures}
                                            callouts={group.callouts}
                                            showTripName={group.departures.some(
                                                (d) =>
                                                    d.triptypeid !==
                                                    group.departures[0]
                                                        ?.triptypeid,
                                            )}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Section>

            {/* Floating filter bar, driven by whatever Arctic returned:
                month chips filter server-side via ?month=, the select jumps
                to a trip group. */}
            {groups !== null && groups.length > 0 && (
                <DepartureFilterBar
                    months={months}
                    activeMonth={activeMonth}
                    trips={jumpTrips}
                />
            )}

            {/* The Book Now CTA lands here now, so give browsers who don't
                see their date a path into the full catalog. */}
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
