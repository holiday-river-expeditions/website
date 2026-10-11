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
