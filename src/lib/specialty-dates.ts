import { getAllUpcomingDepartures } from '@/lib/arctic';
import {
    specialtyDatePages,
    type SpecialtyDatePage,
    tripSpecialtyEntries,
} from '@/lib/departures';
import { getSpecialtyDateIndex, getSpecialtyFamilies } from '@/lib/sanity';

/**
 * Every specialty date that has a page at /specialty/<slug>, from Sanity
 * entries and from Arctic departures that keywords tag. The page route and
 * the sitemap both read this, so the sitemap never lists a page the route
 * would refuse.
 *
 * Arctic only lists upcoming departures, so a date that came from Arctic
 * alone loses its page once it has passed, and while Arctic is down. A
 * Sanity entry keeps its page for old links. Arctic isn't called at all
 * until a family has keywords.
 */
export async function getSpecialtyDatePages(): Promise<SpecialtyDatePage[]> {
    const [index, families] = await Promise.all([
        getSpecialtyDateIndex(),
        getSpecialtyFamilies(),
    ]);
    const departures =
        families.length > 0 ? await getAllUpcomingDepartures() : null;
    return specialtyDatePages(
        index.map((trip) => ({
            ...trip,
            entries: tripSpecialtyEntries(
                trip.entries,
                trip.arcticTripId,
                departures,
                families,
            ),
        })),
    );
}
