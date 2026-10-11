import { getTripPricingLevels } from './booking';
import type { ArcticPricingLevel } from './types';

/**
 * "Starts at" prices come from Arctic, where Holiday sets them. The Sanity
 * `startingPrice` field is only the fallback for trips with no Arctic ids
 * and for when Arctic is unreachable.
 *
 * A trip page can cover several Arctic trip types ("37,38" is Cataract 5-day
 * and 6-day). Each type's price is its full adult fare: the level named
 * Adult (Regular on bike trips), or the highest level when neither exists.
 * The trip starts at the cheapest of those.
 */

function parseIds(raw: string | null | undefined): number[] {
    if (!raw) return [];
    return raw
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((id) => Number.isInteger(id) && id > 0);
}

/** Full adult fare for one trip type's pricing levels, or null. */
export function fullFare(levels: ArcticPricingLevel[]): number | null {
    const priced = levels.filter(
        (level) => typeof level.amount === 'number' && level.amount > 0,
    );
    if (priced.length === 0) return null;
    const named = priced.find((level) =>
        /^(adult|regular)$/i.test(level.name.trim()),
    );
    return (
        named?.amount ??
        Math.max(...priced.map((level) => level.amount as number))
    );
}

export function formatPrice(amount: number): string {
    return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/** Lowest full fare across a trip's Arctic trip types, formatted, or null. */
export async function getStartingPrice(
    arcticTripId: string | null | undefined,
): Promise<string | null> {
    const fares = await Promise.all(
        parseIds(arcticTripId).map(async (id) => {
            const levels = await getTripPricingLevels(id);
            return levels ? fullFare(levels) : null;
        }),
    );
    const known = fares.filter((fare): fare is number => fare !== null);
    return known.length ? formatPrice(Math.min(...known)) : null;
}

type PricedTrip = {
    startingPrice: string | null;
    arcticTripId?: string | null;
};

/** Replace each trip's Sanity startingPrice with Arctic's, where Arctic has one. */
export async function withArcticPrices<T extends PricedTrip>(
    trips: T[] | null | undefined,
): Promise<T[]> {
    if (!trips) return [];
    return Promise.all(
        trips.map(async (trip) => {
            const live = await getStartingPrice(trip.arcticTripId);
            return live ? { ...trip, startingPrice: live } : trip;
        }),
    );
}
