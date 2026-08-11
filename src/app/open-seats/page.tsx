import type { Metadata } from 'next';
import Link from 'next/link';
import { DepartureList } from '@/components/ui/DepartureList';
import { Section } from '@/components/ui/Section';
import {
    type ArcticDeparture,
    getAllUpcomingDepartures,
    getBookableTripTypes,
} from '@/lib/arctic';
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
            { name: string; slug: string }
        >();
        for (const trip of sanityTrips) {
            if (!trip.arcticTripId || !trip.slug?.current || !trip.name) {
                continue;
            }
            for (const raw of trip.arcticTripId.split(',')) {
                const id = Number(raw.trim());
                if (Number.isInteger(id) && id > 0) {
                    sanityByTypeId.set(id, {
                        name: trip.name,
                        slug: trip.slug.current,
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
                group = {
                    key,
                    title:
                        sanityTrip?.name ??
                        publicTypes.get(typeId)?.name ??
                        departure.name ??
                        'Trip',
                    href: sanityTrip ? `/trips/${sanityTrip.slug}` : null,
                    departures: [],
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
                    reservation system. See one you like? Grab it — rivers fill
                    up fast.
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
                        Nothing is listed online right now — call{' '}
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
                        {groups.map((group) => (
                            <div key={group.key}>
                                <h2 className='font-alt-gothic text-[36px] font-black uppercase leading-[0.9] text-onyx'>
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
                                <div className='mt-5'>
                                    <DepartureList
                                        departures={group.departures}
                                        showTripName={group.departures.some(
                                            (d) =>
                                                d.triptypeid !==
                                                group.departures[0]?.triptypeid,
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </>
    );
}
