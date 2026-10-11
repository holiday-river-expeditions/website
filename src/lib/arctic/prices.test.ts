import { beforeEach, expect, test, vi } from 'vitest';
import type { ArcticPricingLevel } from './types';

/**
 * Pricing levels mirror the live Arctic data of 2026-10-11: rafting types
 * have Adult + Senior/Youth, bike types a single Regular level.
 */
const levelsByType: Record<number, ArcticPricingLevel[] | null> = {};
vi.mock('./booking', () => ({
    getTripPricingLevels: vi.fn(async (id: number) => levelsByType[id] ?? null),
}));

// Upcoming departure count per trip type; null is an Arctic failure.
// Types not listed have one departure. The running check caches per type
// for the module's life, so each test uses its own type ids.
const departuresByType: Record<number, number | null> = {};
vi.mock('./trips', () => ({
    getUpcomingDepartures: vi.fn(async (ids: string) => {
        const count = departuresByType[Number(ids)];
        if (count === null) return null;
        return Array.from({ length: count ?? 1 }, (_, i) => ({ id: i }));
    }),
}));

const { fullFare, formatPrice, getStartingPrice, withArcticPrices } =
    await import('./prices');

const level = (name: string, amount: number | null): ArcticPricingLevel => ({
    id: 1,
    name,
    uniquename: name.toLowerCase(),
    amount,
    showonline: true,
    deleted: false,
});

beforeEach(() => {
    for (const key of Object.keys(levelsByType))
        delete levelsByType[Number(key)];
    levelsByType[37] = [level('Adult', 1680), level('Senior/Youth', 1515)];
    levelsByType[38] = [level('Adult', 1840), level('Senior/Youth', 1660)];
    levelsByType[47] = [level('Regular', 1480)];
});

test('fullFare picks the Adult or Regular level, not the discounted one', () => {
    expect(fullFare(levelsByType[37]!)).toBe(1680);
    expect(fullFare(levelsByType[47]!)).toBe(1480);
});

test('fullFare falls back to the highest level when none is named Adult or Regular', () => {
    expect(fullFare([level('Senior/Youth', 900), level('Group', 950)])).toBe(
        950,
    );
});

test('fullFare ignores levels without a price', () => {
    expect(fullFare([level('Adult', null)])).toBeNull();
});

test('formatPrice adds a dollar sign and thousands separator', () => {
    expect(formatPrice(1435)).toBe('$1,435');
    expect(formatPrice(599)).toBe('$599');
});

test('a trip covering several Arctic types starts at the cheapest full fare', async () => {
    expect(await getStartingPrice('37,38')).toBe('$1,680');
    expect(await getStartingPrice(' 38 , 37 ')).toBe('$1,680');
});

test('a length with no upcoming departures does not set the price', async () => {
    // Lodore: 66 is the 3 day, cheaper but not running in 2027.
    levelsByType[66] = [level('Adult', 1255), level('Senior/Youth', 1130)];
    levelsByType[46] = [level('Adult', 1435), level('Senior/Youth', 1295)];
    departuresByType[66] = 0;
    expect(await getStartingPrice('66,46')).toBe('$1,435');
});

test('when no length is running, every linked length counts', async () => {
    levelsByType[51] = [level('Adult', 1320)];
    levelsByType[52] = [level('Adult', 1150)];
    departuresByType[51] = 0;
    departuresByType[52] = 0;
    expect(await getStartingPrice('51,52')).toBe('$1,150');
});

test('an Arctic failure on the departure check still shows the price', async () => {
    levelsByType[55] = [level('Adult', 599)];
    departuresByType[55] = null;
    expect(await getStartingPrice('55')).toBe('$599');
});

test('no Arctic ids, or Arctic returning nothing, gives no price', async () => {
    expect(await getStartingPrice(null)).toBeNull();
    expect(await getStartingPrice('99')).toBeNull();
});

test('withArcticPrices replaces the Sanity price and keeps it as the fallback', async () => {
    const trips = await withArcticPrices([
        { name: 'Cataract', startingPrice: '$1,630', arcticTripId: '37,38' },
        { name: 'San Juan', startingPrice: '$1,150', arcticTripId: null },
        { name: 'Unknown', startingPrice: '$999', arcticTripId: '99' },
    ]);
    expect(trips.map((trip) => trip.startingPrice)).toEqual([
        '$1,680',
        '$1,150',
        '$999',
    ]);
});

test('withArcticPrices handles a missing list', async () => {
    expect(await withArcticPrices(null)).toEqual([]);
});
