import { describe, expect, test } from 'vitest';
import {
    flowTrend,
    parseUsgsDailySeries,
    parseUsgsFlow,
    usgsGaugeUrl,
} from './usgs';

function payload(
    series: Array<Array<{ value: string; dateTime: string }>>,
): unknown {
    return {
        value: {
            timeSeries: series.map((values) => ({
                values: [{ value: values }],
            })),
        },
    };
}

describe('parseUsgsFlow', () => {
    test('returns the latest reading of a single gauge', () => {
        const flow = parseUsgsFlow(
            payload([
                [
                    {
                        value: '1500',
                        dateTime: '2026-08-26T22:00:00.000-06:00',
                    },
                    {
                        value: '1610',
                        dateTime: '2026-08-26T23:00:00.000-06:00',
                    },
                ],
            ]),
        );
        expect(flow).toEqual({
            cfs: 1610,
            asOf: '2026-08-26T23:00:00.000-06:00',
        });
    });

    test('sums gauges and reports the oldest contributing timestamp', () => {
        const flow = parseUsgsFlow(
            payload([
                [{ value: '1610', dateTime: '2026-08-26T23:00:00.000-06:00' }],
                [
                    {
                        value: '1950.4',
                        dateTime: '2026-08-26T22:45:00.000-06:00',
                    },
                ],
            ]),
        );
        expect(flow).toEqual({
            cfs: 3560,
            asOf: '2026-08-26T22:45:00.000-06:00',
        });
    });

    test('skips negative sentinels and empty series', () => {
        const flow = parseUsgsFlow(
            payload([
                [
                    {
                        value: '-999999',
                        dateTime: '2026-08-26T23:00:00.000-06:00',
                    },
                ],
                [],
                [{ value: '591', dateTime: '2026-08-26T23:45:00.000-06:00' }],
            ]),
        );
        expect(flow).toEqual({
            cfs: 591,
            asOf: '2026-08-26T23:45:00.000-06:00',
        });
    });

    test('returns null for garbage or no usable readings', () => {
        expect(parseUsgsFlow(null)).toBeNull();
        expect(parseUsgsFlow({ nope: true })).toBeNull();
        expect(parseUsgsFlow(payload([[]]))).toBeNull();
        expect(
            parseUsgsFlow(
                payload([[{ value: 'ice', dateTime: '2026-01-01T00:00:00Z' }]]),
            ),
        ).toBeNull();
    });
});

test('usgsGaugeUrl links the first gauge', () => {
    expect(usgsGaugeUrl('09180500, 09315000')).toBe(
        'https://waterdata.usgs.gov/monitoring-location/09180500/',
    );
});

function dailyPayload(
    series: Array<Array<{ value: string; dateTime: string }>>,
): unknown {
    return {
        value: {
            timeSeries: series.map((values) => ({
                values: [{ value: values }],
            })),
        },
    };
}

describe('parseUsgsDailySeries', () => {
    test('sums per date and keeps only dates every site reported', () => {
        const series = parseUsgsDailySeries(
            dailyPayload([
                [
                    { value: '1600', dateTime: '2026-08-25T00:00:00.000' },
                    { value: '1610', dateTime: '2026-08-26T00:00:00.000' },
                ],
                [
                    { value: '1950', dateTime: '2026-08-26T00:00:00.000' },
                    { value: '1900', dateTime: '2026-08-27T00:00:00.000' },
                ],
            ]),
        );
        // Only Aug 26 has readings from both gauges.
        expect(series).toEqual([{ date: '2026-08-26', cfs: 3560 }]);
    });

    test('sorts a single-gauge week ascending and skips sentinels', () => {
        const series = parseUsgsDailySeries(
            dailyPayload([
                [
                    { value: '600', dateTime: '2026-08-26T00:00:00.000' },
                    { value: '-999999', dateTime: '2026-08-25T00:00:00.000' },
                    { value: '580', dateTime: '2026-08-24T00:00:00.000' },
                ],
            ]),
        );
        expect(series).toEqual([
            { date: '2026-08-24', cfs: 580 },
            { date: '2026-08-26', cfs: 600 },
        ]);
    });

    test('returns empty for garbage', () => {
        expect(parseUsgsDailySeries(null)).toEqual([]);
        expect(parseUsgsDailySeries({})).toEqual([]);
    });
});

describe('flowTrend', () => {
    const point = (date: string, cfs: number) => ({ date, cfs });
    test('classifies rising, falling, steady with a 5% band', () => {
        expect(flowTrend([point('a', 1000), point('b', 1100)])).toBe('rising');
        expect(flowTrend([point('a', 1000), point('b', 800)])).toBe('falling');
        expect(flowTrend([point('a', 1000), point('b', 1020)])).toBe('steady');
    });
    test('null on empty or zero baselines', () => {
        expect(flowTrend([])).toBeNull();
        expect(flowTrend([point('a', 0), point('b', 10)])).toBeNull();
    });
});
