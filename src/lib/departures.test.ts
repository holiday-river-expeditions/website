import { describe, expect, test } from 'vitest';
import type { ArcticDeparture } from '@/lib/arctic';
import {
    arcticSpecialtyEntries,
    buildCalloutMap,
    buildSpecialtyDateRows,
    calloutFor,
    cleanTypeName,
    familyForKeywords,
    mergeSpecialtyEntries,
    tripSpecialtyEntries,
    departureMonth,
    detectVariants,
    durationToDays,
    filterByMonth,
    formatDateRange,
    formatDayLabel,
    groupDeparturesByMonth,
    isPublicTripType,
    monthOptions,
    nextAvailable,
    parseArcticIds,
    parseMonthParam,
    sortedVariantLabels,
    variantLabelMap,
    slugifyLabel,
    specialtyDateHref,
    specialtyDatePages,
    specialtyDateSlug,
    specialtyDateTitle,
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

    test('links the date page and names the family with a trip slug', () => {
        const map = buildCalloutMap(
            [
                {
                    startDate: '2027-05-15',
                    label: 'Pompe & Honey',
                    specialtyType: {
                        name: 'Canyon Concerts',
                        slug: { current: 'canyon-concerts' },
                    },
                },
            ],
            'yampa',
        );
        expect(map.get('2027-05-15')).toEqual({
            label: 'Canyon Concerts: Pompe & Honey',
            note: null,
            href: '/specialty/pompe-and-honey-yampa-2027-05-15',
        });
    });

    test('gives a phone-only date no badge in the dates list', () => {
        const map = buildCalloutMap(
            [
                {
                    startDate: '2027-08-13',
                    label: 'Affinity Trip',
                    phoneOnly: true,
                },
                { startDate: '2027-07-22', label: 'Theoretical Blonde' },
            ],
            'westwater-canyon',
        );
        expect([...map.keys()]).toEqual(['2027-07-22']);
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
                slug: null,
                phoneOnly: false,
                priceText: null,
                lengthText: null,
                arcticDepartureId: null,
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
            '/specialty/the-pickpockets-yampa-river-2027-06-21',
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

    test('carries a date’s own price and length onto its row', () => {
        const rows = buildSpecialtyDateRows(
            [
                {
                    ...westwater,
                    entries: [
                        {
                            startDate: '2027-08-13',
                            label: 'Affinity Trip',
                            priceText: ' $890 ',
                            lengthText: '3 Days',
                        },
                    ],
                },
            ],
            null,
            '2026-10-21',
        );
        expect(rows[0].priceText).toBe('$890');
        expect(rows[0].lengthText).toBe('3 Days');
    });

    test('never matches a phone-only date to a departure that starts the same day', () => {
        const sameDay = departure({
            id: 7,
            triptypeid: 55,
            start: '2027-08-13',
        });
        const entries = [
            {
                startDate: '2027-08-13',
                label: 'Affinity Trip',
                phoneOnly: true,
            },
        ];
        const rows = buildSpecialtyDateRows(
            [{ ...westwater, entries }],
            [sameDay],
            '2026-10-21',
        );
        expect(rows[0].phoneOnly).toBe(true);
        expect(rows[0].departure).toBeNull();
        // The same entry without the switch does match, which is the
        // collision the switch exists to prevent.
        const open = buildSpecialtyDateRows(
            [{ ...westwater, entries: [{ ...entries[0], phoneOnly: false }] }],
            [sameDay],
            '2026-10-21',
        );
        expect(open[0].departure).toBe(sameDay);
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

describe('specialty date pages', () => {
    test('slugifies labels, spelling out the ampersand', () => {
        expect(slugifyLabel('Pompe & Honey')).toBe('pompe-and-honey');
        expect(slugifyLabel('Women’s River & Yoga!')).toBe(
            'womens-river-and-yoga',
        );
        expect(slugifyLabel('  Café  ')).toBe('cafe');
    });

    test('builds the slug from the label, trip and date', () => {
        const entry = { startDate: '2027-06-29', label: 'Stargazing Special' };
        expect(specialtyDateSlug(entry, 'gates-of-lodore')).toBe(
            'stargazing-special-gates-of-lodore-2027-06-29',
        );
        expect(specialtyDateHref(entry, 'gates-of-lodore')).toBe(
            '/specialty/stargazing-special-gates-of-lodore-2027-06-29',
        );
    });

    test('a slug pinned in the Studio wins', () => {
        expect(
            specialtyDateSlug(
                {
                    startDate: '2027-05-15',
                    label: 'Pompe & Honey',
                    slug: { current: 'pompe-n-honey' },
                },
                'yampa',
            ),
        ).toBe('pompe-n-honey');
    });

    test('ignores a pin the URL cannot carry as written', () => {
        for (const bad of [
            'Pompe & Honey',
            'a/b',
            'Has Space',
            '-lead',
            'x--y',
        ]) {
            expect(
                specialtyDateSlug(
                    {
                        startDate: '2027-05-15',
                        label: 'Pompe & Honey',
                        slug: { current: bad },
                    },
                    'yampa',
                ),
            ).toBe('pompe-and-honey-yampa-2027-05-15');
        }
    });

    test('lists one page per slug, first entry wins', () => {
        const pages = specialtyDatePages([
            {
                tripSlug: 'westwater-canyon',
                _updatedAt: '2026-11-01T00:00:00Z',
                entries: [
                    {
                        _key: 'a',
                        startDate: '2027-07-22',
                        label: 'Theoretical Blonde',
                        slug: { current: 'the-band' },
                    },
                ],
            },
            {
                tripSlug: 'yampa',
                _updatedAt: '2026-11-02T00:00:00Z',
                entries: [
                    // Same pin as Westwater's: no page of its own.
                    {
                        _key: 'b',
                        startDate: '2027-05-15',
                        label: 'Pompe & Honey',
                        slug: { current: 'the-band' },
                    },
                    {
                        _key: 'c',
                        startDate: '2027-06-21',
                        label: 'Pickpockets',
                    },
                    // Second entry on a date: same derived slug only when
                    // the label matches too.
                    {
                        _key: 'd',
                        startDate: '2027-06-21',
                        label: 'Pickpockets',
                    },
                    // No label, even with a pin: the route would refuse it.
                    {
                        _key: 'e',
                        startDate: '2027-07-01',
                        slug: { current: 'no-label' },
                    },
                    { _key: 'f', label: 'No date' },
                ],
            },
            {
                tripSlug: null,
                entries: [{ startDate: '2027-01-01', label: 'x' }],
            },
        ]);
        expect(
            pages.map((page) => [page.slug, page.tripSlug, page.key]),
        ).toEqual([
            ['the-band', 'westwater-canyon', 'a'],
            ['pickpockets-yampa-2027-06-21', 'yampa', 'c'],
        ]);
        expect(pages[1].updatedAt).toBe('2026-11-02T00:00:00Z');
    });

    test('has no slug without a trip, a date or a usable label', () => {
        const entry = { startDate: '2027-05-15', label: 'Pompe & Honey' };
        expect(specialtyDateSlug(entry, null)).toBeNull();
        expect(specialtyDateSlug({ label: 'x' }, 'yampa')).toBeNull();
        expect(
            specialtyDateSlug(
                { startDate: '2027-05-15', label: '!!' },
                'yampa',
            ),
        ).toBeNull();
        expect(specialtyDateHref(entry, null)).toBeNull();
    });

    test('puts the family name in front of the label', () => {
        expect(specialtyDateTitle('Pompe & Honey', 'Canyon Concerts')).toBe(
            'Canyon Concerts: Pompe & Honey',
        );
        expect(specialtyDateTitle('New Moon', null)).toBe('New Moon');
    });
});

describe('isPublicTripType', () => {
    const arctic = new Set([37, 41]);
    const sanity = new Map([[59, 'yampa']]);

    test('keeps a type Arctic has switched on for online reservations', () => {
        expect(isPublicTripType(37, arctic, sanity)).toBe(true);
    });

    test('keeps a type with a Sanity trip page though Arctic has it off', () => {
        expect(isPublicTripType(59, arctic, sanity)).toBe(true);
    });

    test('drops a type with neither, and a departure with no type', () => {
        expect(isPublicTripType(12, arctic, sanity)).toBe(false);
        expect(isPublicTripType(null, arctic, sanity)).toBe(false);
        expect(isPublicTripType(undefined, arctic, sanity)).toBe(false);
    });
});

describe('specialty dates from Arctic keywords', () => {
    const music = {
        _id: 'music',
        name: 'Canyon Concerts',
        slug: { current: 'canyon-concerts' },
        arcticKeywords: ['MT'],
    };
    const womens = {
        _id: 'womens',
        name: "Women's Trips",
        slug: { current: 'womens' },
        arcticKeywords: ['WT'],
    };
    const affinity = {
        _id: 'affinity',
        name: 'Affinity & Custom Groups',
        slug: { current: 'affinity' },
        arcticKeywords: ['AT', 'LGBTQ'],
    };
    const families = [music, womens, affinity];

    describe('familyForKeywords', () => {
        test('ignores case and spacing on both sides', () => {
            expect(familyForKeywords([' mt '], families)).toBe(music);
            expect(
                familyForKeywords(
                    ['WT'],
                    [{ ...womens, arcticKeywords: ['wt '] }],
                )?._id,
            ).toBe('womens');
        });

        test('takes the first family in order when two match', () => {
            expect(familyForKeywords(['AT', 'WT'], families)).toBe(womens);
        });

        test('returns null for no keywords or no match', () => {
            expect(familyForKeywords(null, families)).toBeNull();
            expect(familyForKeywords(['Special', 'DS'], families)).toBeNull();
            expect(familyForKeywords(['MT'], [])).toBeNull();
        });
    });

    describe('arcticSpecialtyEntries', () => {
        const pompe = departure({
            id: 1501,
            triptypeid: 59,
            name: 'Yampa River  Pompe & Honey Music Trip',
            start: '2027-05-15',
            keywords: ['Dinosaur', 'MT', 'Special', 'YM'],
        });

        test('makes an entry from a tagged departure of the trip', () => {
            expect(
                arcticSpecialtyEntries([pompe], families, new Set([59, 60])),
            ).toEqual([
                {
                    _key: 'arctic-1501',
                    startDate: '2027-05-15',
                    label: 'Yampa River Pompe & Honey Music Trip',
                    arcticDepartureId: 1501,
                    specialtyType: music,
                },
            ]);
        });

        test('skips other trips, untagged, canceled and charter departures', () => {
            const departures = [
                { ...pompe, triptypeid: 41 },
                { ...pompe, id: 2, keywords: ['Special'] },
                { ...pompe, id: 3, keywords: null },
                { ...pompe, id: 4, canceled: true },
                { ...pompe, id: 5, keywords: ['Charter', 'MT'] },
                { ...pompe, id: 6, name: '  ' },
            ];
            expect(
                arcticSpecialtyEntries(departures, families, new Set([59])),
            ).toEqual([]);
        });

        test('needs families with keywords and a trip with ids', () => {
            expect(arcticSpecialtyEntries([pompe], [], new Set([59]))).toEqual(
                [],
            );
            expect(
                arcticSpecialtyEntries([pompe], families, new Set()),
            ).toEqual([]);
            expect(
                arcticSpecialtyEntries(null, families, new Set([59])),
            ).toEqual([]);
        });
    });

    describe('mergeSpecialtyEntries', () => {
        const arctic = arcticSpecialtyEntries(
            [
                departure({
                    id: 1501,
                    triptypeid: 59,
                    name: 'Yampa River Pompe & Honey Music Trip',
                    start: '2027-05-15',
                    keywords: ['MT'],
                }),
                departure({
                    id: 1502,
                    triptypeid: 60,
                    name: 'Yampa River Del Sol Quartet Music Trip',
                    start: '2027-06-05',
                    keywords: ['MT'],
                }),
            ],
            families,
            new Set([59, 60]),
        );

        test('a Sanity entry replaces the Arctic date on its day and takes its id', () => {
            const merged = mergeSpecialtyEntries(
                [
                    {
                        _key: 'a',
                        startDate: '2027-05-15',
                        label: 'Pompe & Honey',
                    },
                ],
                arctic,
            );
            expect(merged).toEqual([
                {
                    _key: 'a',
                    startDate: '2027-05-15',
                    label: 'Pompe & Honey',
                    arcticDepartureId: 1501,
                },
                arctic[1],
            ]);
        });

        test('keeps Sanity dates Arctic does not tag', () => {
            const merged = mergeSpecialtyEntries(
                [{ startDate: '2027-09-01', label: 'Not in Arctic' }],
                arctic,
            );
            expect(merged.map((e) => e.startDate)).toEqual([
                '2027-09-01',
                '2027-05-15',
                '2027-06-05',
            ]);
        });

        test('a phone-only entry claims its day but never takes the id', () => {
            const [entry, ...rest] = mergeSpecialtyEntries(
                [
                    {
                        startDate: '2027-05-15',
                        label: 'By phone',
                        phoneOnly: true,
                    },
                ],
                arctic,
            );
            expect(entry.arcticDepartureId).toBeUndefined();
            expect(rest).toEqual([arctic[1]]);
        });

        test('an entry without a label leaves the Arctic date in place', () => {
            const merged = mergeSpecialtyEntries(
                [{ startDate: '2027-05-15', label: ' ' }],
                arctic,
            );
            expect(merged).toHaveLength(3);
            expect(merged).toContain(arctic[0]);
        });
    });

    test('badges only the tagged departure when another starts the same day', () => {
        // Westwater, 2027-08-20: a regular 3 day and the LGBTQ+ trip.
        const regular = departure({
            id: 1293,
            triptypeid: 56,
            name: 'Westwater/Ruby Canyon 3 Day',
            start: '2027-08-20',
            keywords: ['RB', 'Westwater'],
        });
        const tagged = departure({
            id: 1418,
            triptypeid: 56,
            name: 'Westwater/Ruby Canyon LGBTQ+ Affinity',
            start: '2027-08-20',
            keywords: ['AT', 'LGBTQ', 'Special'],
        });
        const callouts = buildCalloutMap(
            tripSpecialtyEntries(null, '55,56', [regular, tagged], families),
            'westwater-canyon',
        );
        expect(calloutFor(callouts, regular)).toBeUndefined();
        expect(calloutFor(callouts, tagged)).toEqual({
            label: 'Affinity & Custom Groups: Westwater/Ruby Canyon LGBTQ+ Affinity',
            note: null,
            href: '/specialty/westwater-ruby-canyon-lgbtq-affinity-westwater-canyon-2027-08-20',
        });

        const rows = buildSpecialtyDateRows(
            [
                {
                    _id: 'westwater',
                    name: 'Westwater Canyon',
                    slug: { current: 'westwater-canyon' },
                    arcticTripId: '55,56',
                    entries: tripSpecialtyEntries(
                        null,
                        '55,56',
                        [regular, tagged],
                        families,
                    ),
                },
            ],
            [regular, tagged],
            '2026-11-19',
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].departure?.id).toBe(1418);
    });

    test('a date-keyed Sanity callout still badges by day', () => {
        const callouts = buildCalloutMap([
            { startDate: '2027-07-01', label: 'Glen Canyon Institute' },
        ]);
        expect(
            calloutFor(callouts, departure({ id: 7, start: '2027-07-01' }))
                ?.label,
        ).toBe('Glen Canyon Institute');
    });
});
