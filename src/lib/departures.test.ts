import { describe, expect, test } from 'vitest';
import type { ArcticDeparture } from '@/lib/arctic';
import {
    buildCalloutMap,
    buildSpecialtyDateRows,
    cleanTypeName,
    departureAnchor,
    departureMonth,
    detectVariants,
    durationToDays,
    filterByMonth,
    formatDateRange,
    formatDayLabel,
    groupDeparturesByMonth,
    monthOptions,
    nextAvailable,
    parseArcticIds,
    parseMonthParam,
    sortedVariantLabels,
    variantLabelMap,
    upcomingSpecialtyDates,
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

describe('month filtering', () => {
    test('departureMonth extracts YYYY-MM and rejects garbage', () => {
        expect(departureMonth('2026-09-12')).toBe('2026-09');
        expect(departureMonth('garbage')).toBeNull();
        expect(departureMonth(null)).toBeNull();
        expect(departureMonth(undefined)).toBeNull();
    });

    test('parseMonthParam accepts only a single YYYY-MM value', () => {
        expect(parseMonthParam('2026-09')).toBe('2026-09');
        expect(parseMonthParam('2026-9')).toBeNull();
        expect(parseMonthParam(['2026-09', '2026-10'])).toBeNull();
        expect(parseMonthParam(undefined)).toBeNull();
        expect(parseMonthParam('drop table')).toBeNull();
    });

    test('monthOptions dedupes, sorts, and shows the year only when it changes', () => {
        const options = monthOptions([
            departure({ start: '2027-05-03' }),
            departure({ start: '2026-09-12' }),
            departure({ start: '2026-09-19' }),
            departure({ start: '2026-10-02' }),
        ]);
        expect(options).toEqual([
            { value: '2026-09', label: 'Sep' },
            { value: '2026-10', label: 'Oct' },
            { value: '2027-05', label: "May '27" },
        ]);
    });

    test('filterByMonth keeps matching departures; null month keeps all', () => {
        const list = [
            departure({ start: '2026-09-12' }),
            departure({ start: '2026-10-02' }),
        ];
        expect(filterByMonth(list, '2026-09')).toHaveLength(1);
        expect(filterByMonth(list, null)).toHaveLength(2);
        expect(filterByMonth(list, '2025-01')).toHaveLength(0);
    });
});

describe('variantLabelMap', () => {
    test('labels a single-type list by its duration', () => {
        const labels = variantLabelMap([departure({ triptypeid: 45 })]);
        expect(Object.fromEntries(labels)).toEqual({ 45: '5-Day' });
    });

    test('labels each type of a multi-type list', () => {
        const labels = variantLabelMap([
            departure({ id: 1, triptypeid: 57, duration: '96:00:00' }),
            departure({ id: 2, triptypeid: 58, duration: '72:00:00' }),
        ]);
        expect(Object.fromEntries(labels)).toEqual({
            57: '4-Day',
            58: '3-Day',
        });
        expect(sortedVariantLabels(labels)).toEqual(['3-Day', '4-Day']);
    });

    test('sorts by days, not alphabetically', () => {
        expect(
            sortedVariantLabels(
                new Map([
                    [1, '12-Day'],
                    [2, '5-Day'],
                ]),
            ),
        ).toEqual(['5-Day', '12-Day']);
    });
});

describe('parseArcticIds', () => {
    test('splits and trims comma-separated ids', () => {
        expect(parseArcticIds('37, 38,63')).toEqual([37, 38, 63]);
    });
    test('drops blanks and junk', () => {
        expect(parseArcticIds('37,,abc,-4,0')).toEqual([37]);
        expect(parseArcticIds(null)).toEqual([]);
    });
});

describe('upcomingSpecialtyDates', () => {
    test('keeps today and later, sorted by date', () => {
        expect(
            upcomingSpecialtyDates(
                [
                    { startDate: '2027-06-21', label: 'The Pickpockets' },
                    { startDate: '2026-09-01', label: 'Past' },
                    { startDate: '2027-05-15', label: 'Pompe & Honey' },
                    { startDate: '2026-10-21', label: 'Today' },
                ],
                '2026-10-21',
            ).map((date) => date.label),
        ).toEqual(['Today', 'Pompe & Honey', 'The Pickpockets']);
    });

    test('follows buildCalloutMap: needs date and label, first wins', () => {
        expect(
            upcomingSpecialtyDates(
                [
                    { startDate: '2027-06-21', label: 'First', note: 'n' },
                    { startDate: '2027-06-21', label: 'Second' },
                    { startDate: '2027-07-01' },
                    { label: 'No date' },
                ],
                '2026-10-21',
            ),
        ).toEqual([
            {
                startDate: '2027-06-21',
                label: 'First',
                note: 'n',
                image: null,
            },
        ]);
    });
});

describe('buildSpecialtyDateRows', () => {
    const yampa = {
        _id: 'yampa',
        name: 'Yampa River',
        slug: { current: 'yampa-river' },
        startingPrice: '$1,300',
        arcticTripId: '59,60',
        entries: [
            { startDate: '2027-06-21', label: 'The Pickpockets' },
            { startDate: '2027-05-15', label: 'Pompe & Honey' },
        ],
    };
    const westwater = {
        _id: 'westwater',
        name: 'Westwater Canyon',
        slug: { current: 'westwater-canyon' },
        startingPrice: '$599',
        arcticTripId: '55',
        entries: [{ startDate: '2027-06-01', label: 'Theoretical Blonde' }],
    };

    test('merges every trip into one list by date, linking the row', () => {
        const rows = buildSpecialtyDateRows(
            [yampa, westwater],
            null,
            '2026-10-21',
        );
        expect(rows.map((row) => [row.startDate, row.tripName])).toEqual([
            ['2027-05-15', 'Yampa River'],
            ['2027-06-01', 'Westwater Canyon'],
            ['2027-06-21', 'Yampa River'],
        ]);
        expect(rows[2].href).toBe(
            `/trips/yampa-river#${departureAnchor('2027-06-21')}`,
        );
        expect(rows[2].departure).toBeNull();
        expect(rows[2].startingPrice).toBe('$1,300');
    });

    test('matches the Arctic departure by trip type and date', () => {
        const match = departure({
            id: 9,
            triptypeid: 60,
            start: '2027-06-21',
        });
        const rows = buildSpecialtyDateRows(
            [yampa],
            [
                // Same date on another trip's type: not this row's.
                departure({ id: 8, triptypeid: 55, start: '2027-06-21' }),
                match,
            ],
            '2026-10-21',
        );
        expect(
            rows.find((row) => row.startDate === '2027-06-21')?.departure,
        ).toBe(match);
    });

    test('drops past dates and omits href without a slug', () => {
        const rows = buildSpecialtyDateRows(
            [{ ...westwater, slug: null }],
            null,
            '2027-07-01',
        );
        expect(rows).toEqual([]);
        const [row] = buildSpecialtyDateRows(
            [{ ...westwater, slug: null }],
            null,
            '2026-10-21',
        );
        expect(row.href).toBeNull();
    });

    test('uses the date photo, else the trip photo', () => {
        const tripPhoto = { asset: { _ref: 'image-trip' }, alt: 'Yampa' };
        const bandPhoto = { asset: { _ref: 'image-band' }, alt: 'The band' };
        const rows = buildSpecialtyDateRows(
            [
                {
                    ...yampa,
                    image: tripPhoto,
                    entries: [
                        {
                            startDate: '2027-05-15',
                            label: 'Pompe & Honey',
                            image: bandPhoto,
                        },
                        // Alt text with no upload counts as no photo.
                        {
                            startDate: '2027-06-21',
                            label: 'The Pickpockets',
                            image: { alt: 'Unfinished' },
                        },
                        { startDate: '2027-06-05', label: 'Del Sol Quartet' },
                    ],
                },
            ],
            null,
            '2026-10-21',
        );
        expect(rows.map((row) => row.image)).toEqual([
            bandPhoto,
            tripPhoto,
            tripPhoto,
        ]);
    });

    test('leaves the image null when neither has a photo', () => {
        const [row] = buildSpecialtyDateRows([westwater], null, '2026-10-21');
        expect(row.image).toBeNull();
    });
});
