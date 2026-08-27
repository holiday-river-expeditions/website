import { describe, expect, test } from 'vitest';
import { parseUsgsFlow, usgsGaugeUrl } from './usgs';

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
