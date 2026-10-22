import { beforeEach, expect, test, vi } from 'vitest';

/**
 * Departure names mirror live Arctic data of 2026-10-11. Charters can be
 * left bookable online (orenable = true), so the name check is what keeps
 * them off public pages.
 */
const entries: unknown[] = [];
// Serves `entries` the way Arctic does: the query's LIMIT offset, count
// clause picks the page.
const arcticGet = vi.fn(
    async (_path: string, _schema: unknown, params?: { query?: string }) => {
        const limit = /LIMIT (\d+), (\d+)$/.exec(params?.query ?? '');
        if (!limit) return { entries: entries.slice(0, 50) };
        const offset = Number(limit[1]);
        return { entries: entries.slice(offset, offset + Number(limit[2])) };
    },
);
vi.mock('./client', () => ({ arcticGet }));
vi.mock('./config', () => ({ isArcticConfigured: () => true }));

const { getAllUpcomingDepartures, getUpcomingDepartures, isPrivateCharter } =
    await import('./trips');

const departure = (id: number, name: string, start: string) => ({
    id,
    triptypeid: 42,
    name,
    start,
    canceled: false,
});

/** `count` departures, one a day from 2027-04-01, in Arctic's order. */
function season(count: number) {
    for (let i = 0; i < count; i++) {
        const start = new Date(Date.UTC(2027, 3, 1 + i))
            .toISOString()
            .slice(0, 10);
        entries.push(departure(i + 1, 'Desolation Canyon 6 day', start));
    }
}

const queries = () =>
    arcticGet.mock.calls.map(([, , params]) => params?.query ?? '');

beforeEach(() => {
    entries.length = 0;
    arcticGet.mockClear();
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

test('all upcoming departures page past the 50-row cap', async () => {
    season(450);
    const result = await getAllUpcomingDepartures();
    expect(result).toHaveLength(450);
    expect(result?.at(-1)?.id).toBe(450);
    expect(queries().map((q) => q.match(/LIMIT .*$/)?.[0])).toEqual([
        'LIMIT 0, 200',
        'LIMIT 200, 200',
        'LIMIT 400, 200',
    ]);
    expect(queries()[0]).toContain('ORDER BY start, id');
});

test('a full last page costs one more empty request', async () => {
    season(200);
    expect(await getAllUpcomingDepartures()).toHaveLength(200);
    expect(arcticGet).toHaveBeenCalledTimes(2);
});

test('paging stops at the page cap', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    season(2500);
    expect(await getAllUpcomingDepartures()).toHaveLength(2000);
    expect(arcticGet).toHaveBeenCalledTimes(10);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
});

test('a departure seen on two pages is kept once', async () => {
    season(250);
    // A departure added mid-fetch pushes row 200 onto page two as well.
    arcticGet.mockImplementationOnce(async () => ({
        entries: entries.slice(0, 200),
    }));
    arcticGet.mockImplementationOnce(async () => ({
        entries: entries.slice(199, 250),
    }));
    const result = await getAllUpcomingDepartures();
    expect(result).toHaveLength(250);
    expect(new Set(result?.map((d) => d.id)).size).toBe(250);
});

test('per-trip departures page too, for trips with several lengths', async () => {
    season(260);
    const result = await getUpcomingDepartures('37,38,63,62');
    expect(result).toHaveLength(260);
    expect(arcticGet).toHaveBeenCalledTimes(2);
    expect(queries()[0]).toContain('triptypeid IN (37, 38, 63, 62)');
});

test('a failed page makes the whole fetch fall back to null', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    season(450);
    arcticGet.mockImplementationOnce(async () => ({
        entries: entries.slice(0, 200),
    }));
    arcticGet.mockRejectedValueOnce(new Error('Arctic server error'));
    expect(await getAllUpcomingDepartures()).toBeNull();
    error.mockRestore();
});
