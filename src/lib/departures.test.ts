import { describe, expect, test } from 'vitest';
import type { ArcticDeparture } from '@/lib/arctic';
import {
    buildCalloutMap,
    cleanTypeName,
    detectVariants,
    durationToDays,
    formatDateRange,
    formatDayLabel,
    groupDeparturesByMonth,
    nextAvailable,
} from './departures';

function departure(overrides: Partial<ArcticDeparture>): ArcticDeparture {
    return {
        id: 1,
        triptypeid: 37,
        name: 'Cataract Canyon 5 day',
        start: '2026-08-10',
        starttime: null,
        canceled: false,
        openings: 20,
        remainingopenings: 10,
        duration: '120:00:00',
        guests: 0,
        onlinebookingurl: 'https://example.com/reserve',
        ...overrides,
    };
}

describe('durationToDays', () => {
    test('converts Arctic HH:MM:SS to days', () => {
        expect(durationToDays('120:00:00')).toBe(5);
        expect(durationToDays('48:00:00')).toBe(2);
    });
    test('handles missing/invalid values', () => {
        expect(durationToDays(null)).toBeNull();
        expect(durationToDays('')).toBeNull();
        expect(durationToDays('nonsense')).toBeNull();
    });
});

describe('formatDateRange', () => {
    test('formats multi-day range inclusive of both ends', () => {
        expect(formatDateRange('2026-08-10', '144:00:00')).toBe(
            'Aug 10 – Aug 15',
        );
    });
    test('crosses month boundaries', () => {
        expect(formatDateRange('2026-08-30', '96:00:00')).toBe(
            'Aug 30 – Sep 2',
        );
    });
    test('single day renders one date', () => {
        expect(formatDateRange('2026-08-10', '24:00:00')).toBe('Aug 10');
    });
    test('falls back to raw string on invalid date', () => {
        expect(formatDateRange('soon', '24:00:00')).toBe('soon');
    });
});

describe('groupDeparturesByMonth', () => {
    test('buckets by month and hides year within a single year', () => {
        const groups = groupDeparturesByMonth([
            departure({ id: 1, start: '2026-08-10' }),
            departure({ id: 2, start: '2026-08-20' }),
            departure({ id: 3, start: '2026-09-01' }),
        ]);
        expect(groups.map((g) => g.monthLabel)).toEqual([
            'August',
            'September',
        ]);
        expect(groups[0].departures).toHaveLength(2);
        expect(groups.every((g) => !g.showYear)).toBe(true);
    });

    test('shows years when the list spans a year boundary', () => {
        const groups = groupDeparturesByMonth([
            departure({ id: 1, start: '2026-09-10' }),
            departure({ id: 2, start: '2027-05-01' }),
        ]);
        expect(groups.every((g) => g.showYear)).toBe(true);
        expect(groups.map((g) => g.year)).toEqual([2026, 2027]);
    });

    test('keeps invalid dates in a trailing bucket', () => {
        const groups = groupDeparturesByMonth([
            departure({ id: 1, start: '2026-08-10' }),
            departure({ id: 2, start: 'tbd' }),
        ]);
        expect(groups.at(-1)?.monthLabel).toBe('Other dates');
        expect(groups.at(-1)?.departures).toHaveLength(1);
    });
});

describe('nextAvailable', () => {
    test('skips sold-out and canceled leaders', () => {
        const next = nextAvailable([
            departure({ id: 1, remainingopenings: 0 }),
            departure({ id: 2, canceled: true, remainingopenings: 5 }),
            departure({ id: 3, remainingopenings: 4, start: '2026-09-01' }),
        ]);
        expect(next?.id).toBe(3);
    });
    test('null when everything is full', () => {
        expect(nextAvailable([departure({ remainingopenings: 0 })])).toBeNull();
    });
});

describe('detectVariants', () => {
    test('returns empty for a single trip type', () => {
        expect(detectVariants([departure({}), departure({ id: 2 })])).toEqual(
            [],
        );
    });

    test('labels variants by duration in days', () => {
        const variants = detectVariants([
            departure({ id: 1, triptypeid: 37, duration: '120:00:00' }),
            departure({ id: 2, triptypeid: 38, duration: '144:00:00' }),
        ]);
        expect(variants).toEqual([
            { triptypeid: 37, label: '5-Day' },
            { triptypeid: 38, label: '6-Day' },
        ]);
    });

    test('falls back to cleaned names on duration collision', () => {
        const variants = detectVariants(
            [
                departure({ id: 1, triptypeid: 55, duration: '72:00:00' }),
                departure({ id: 2, triptypeid: 49, duration: '72:00:00' }),
            ],
            [
                {
                    id: 55,
                    name: 'Westwater/Ruby Canyon 3 Day',
                    orname: 'Westwater/Ruby Canyon',
                    duration: '72:00:00',
                },
                {
                    id: 49,
                    name: 'Ruby Horsethief Canyon 3 Day',
                    orname: 'Ruby Horsethief Canyon',
                    duration: '72:00:00',
                },
            ],
        );
        expect(variants.map((v) => v.label)).toEqual([
            'Ruby Horsethief Canyon',
            'Westwater/Ruby Canyon',
        ]);
    });
});

describe('cleanTypeName', () => {
    test('prefers orname when set', () => {
        expect(cleanTypeName('Cataract Canyon 5 day', 'Cataract Canyon')).toBe(
            'Cataract Canyon',
        );
    });
    test('title-cases lowercase day suffixes', () => {
        expect(cleanTypeName('Desolation Canyon 6 day')).toBe(
            'Desolation Canyon 6 Day',
        );
    });
    test('strips legacy Z-year prefixes', () => {
        expect(cleanTypeName('Z- 2024 Westwater Canyon Rafting Trip')).toBe(
            'Westwater Canyon Rafting Trip',
        );
    });
});

describe('formatDayLabel', () => {
    test('formats a bare YYYY-MM-DD in UTC', () => {
        expect(formatDayLabel('2026-09-12')).toBe('Sep 12, 2026');
    });
    test('does not slip a day in western timezones', () => {
        // Parsed as UTC midnight, not local — a naive new Date(s) in Denver
        // would render Dec 31.
        expect(formatDayLabel('2027-01-01')).toBe('Jan 1, 2027');
    });
    test('returns the input unchanged when unparseable', () => {
        expect(formatDayLabel('not-a-date')).toBe('not-a-date');
        expect(formatDayLabel('')).toBe('');
    });
});

describe('buildCalloutMap', () => {
    test('indexes callouts by start date and links the hub section', () => {
        const map = buildCalloutMap([
            {
                startDate: '2026-09-12',
                label: 'With The Pickpockets',
                note: 'Two sets on the beach.',
                specialtyType: { slug: { current: 'canyon-concerts' } },
            },
        ]);
        expect(map.get('2026-09-12')).toEqual({
            label: 'With The Pickpockets',
            note: 'Two sets on the beach.',
            href: '/specialty#canyon-concerts',
        });
    });

    test('omits href when no specialty type is referenced', () => {
        const map = buildCalloutMap([
            { startDate: '2026-09-12', label: 'New Moon' },
        ]);
        expect(map.get('2026-09-12')).toEqual({
            label: 'New Moon',
            note: null,
            href: null,
        });
    });

    test('skips entries missing a date or label', () => {
        const map = buildCalloutMap([
            { startDate: '2026-09-12' },
            { label: 'Orphan label' },
            { startDate: '   ', label: 'Blank date' },
            { startDate: '2026-09-20', label: '   ' },
        ]);
        expect(map.size).toBe(0);
    });

    test('first entry wins when two share a start date', () => {
        const map = buildCalloutMap([
            { startDate: '2026-09-12', label: 'First' },
            { startDate: '2026-09-12', label: 'Second' },
        ]);
        expect(map.size).toBe(1);
        expect(map.get('2026-09-12')?.label).toBe('First');
    });

    test('trims whitespace around authored values', () => {
        const map = buildCalloutMap([
            { startDate: ' 2026-09-12 ', label: ' Stargazing ' },
        ]);
        expect(map.get('2026-09-12')?.label).toBe('Stargazing');
    });

    test('handles null and undefined input', () => {
        expect(buildCalloutMap(null).size).toBe(0);
        expect(buildCalloutMap(undefined).size).toBe(0);
        expect(buildCalloutMap([]).size).toBe(0);
    });
});
