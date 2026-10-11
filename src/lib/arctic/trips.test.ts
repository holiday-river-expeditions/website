import { beforeEach, expect, test, vi } from 'vitest';

/**
 * Departure names mirror live Arctic data of 2026-10-11. Charters can be
 * left bookable online (orenable = true), so the name check is what keeps
 * them off public pages.
 */
const entries: unknown[] = [];
vi.mock('./client', () => ({
    arcticGet: vi.fn(async () => ({ entries })),
}));
vi.mock('./config', () => ({ isArcticConfigured: () => true }));

const { getUpcomingDepartures, isPrivateCharter } = await import('./trips');

const departure = (id: number, name: string, start: string) => ({
    id,
    triptypeid: 42,
    name,
    start,
    canceled: false,
});

beforeEach(() => {
    entries.length = 0;
});

test('isPrivateCharter matches charter names in any case', () => {
    expect(
        isPrivateCharter({ name: 'Desolation Canyon Shriners Charter' }),
    ).toBe(true);
    expect(isPrivateCharter({ name: 'Yampa River 5 day Butler charter' })).toBe(
        true,
    );
});

test('isPrivateCharter leaves public and specialty departures alone', () => {
    expect(isPrivateCharter({ name: 'Desolation Canyon 6 day' })).toBe(false);
    expect(
        isPrivateCharter({ name: 'Desolation Canyon Stargazing Special' }),
    ).toBe(false);
    expect(isPrivateCharter({ name: null })).toBe(false);
});

test('upcoming departures drop charters and keep the rest in date order', async () => {
    entries.push(
        departure(3, 'Desolation Canyon 6 day', '2027-08-02'),
        departure(2, 'Desolation Canyon Shriners Charter', '2027-07-26'),
        departure(1, 'Desolation Canyon Kayak Workshop', '2027-07-12'),
    );
    const result = await getUpcomingDepartures('42');
    expect(result?.map((d) => d.id)).toEqual([1, 3]);
});
