import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { DepartureList } from '@/components/ui/DepartureList';
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
    formatDateRange,
    nextAvailable,
} from '@/lib/departures';
import { getAllTrips } from '@/lib/sanity';

// Availability changes as reservations come in; regenerate every minute.
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Open Seats',
    description:
        'Real-time availability on upcoming Holiday River Expeditions rafting and mountain biking trips.',
};

interface TripGroup {
    key: string;
    title: string;
    href: string | null;
    departures: ArcticDeparture[];
    /** Specialty callouts for this trip, keyed by departure start date. */
    callouts?: DepartureCalloutMap;
}

export default async function OpenSeatsPage() {
    const [departures, tripTypes, sanityTrips] = await Promise.all([
        getAllUpcomingDepartures(),
        getBookableTripTypes(),
        getAllTrips(),
    ]);

    let groups: TripGroup[] | null = null;
    if (departures !== null && tripTypes !== null) {
        // Public catalog only: keep departures whose trip type has online
        // reservations enabled in Arctic.
        const publicTypes = new Map(tripTypes.map((t) => [t.id, t]));

        // Arctic trip-type id → Sanity trip page, via the arcticTripId field.
        const sanityByTypeId = new Map<
            number,
            { name: string; slug: string; callouts: DepartureCalloutMap }
        >();
        for (const trip of sanityTrips) {
            if (!trip.arcticTripId || !trip.slug?.current || !trip.name) {
                continue;
            }
            // Built once per trip and shared across its trip-type ids.
            const callouts = buildCalloutMap(trip.specialtyDepartures);
            for (const raw of trip.arcticTripId.split(',')) {
                const id = Number(raw.trim());
                if (Number.isInteger(id) && id > 0) {
                    sanityByTypeId.set(id, {
                        name: trip.name,
                        slug: trip.slug.current,
                        callouts,
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

    return (
        <>
            <Section background='white' className='pb-4 pt-14 md:pt-20'>
                <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    Open Seats
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
                ) : groups.length === 0 ? (
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
                ) : (
                    <div className='max-w-4xl space-y-14'>
                        {groups.map((group) => {
                            const next = nextAvailable(group.departures);
                            return (
                                <div key={group.key} data-availability>
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
