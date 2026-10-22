import { describe, expect, test } from 'vitest';
import type { ArcticDeparture } from '@/lib/arctic';
import {
    bookHref,
    departureLength,
    facetCounts,
    filterGroups,
    isPlaceholderCopy,
    NO_FILTERS,
    parseBookFilters,
    tripParam,
} from './book-filters';

function departure(overrides: Partial<ArcticDeparture>): ArcticDeparture {
    return {
        id: 1,
        triptypeid: 57,
        name: 'White Rim 3 day',
        start: '2027-05-10',
        starttime: null,
        canceled: false,
        openings: 20,
        remainingopenings: 10,
        duration: '72:00:00',
        guests: 0,
        onlinebookingurl: 'https://example.com/reserve',
        ...overrides,
    };
}

const groups = [
    {
        key: 'sanity:white-rim-trail',
        departures: [
            departure({ id: 1, start: '2027-05-10', duration: '72:00:00' }),
            departure({ id: 2, start: '2027-05-17', duration: '96:00:00' }),
            departure({ id: 3, start: '2027-06-07', duration: '72:00:00' }),
        ],
    },
    {
        key: 'arctic:45',
        departures: [
            departure({ id: 4, start: '2027-06-01', duration: '120:00:00' }),
        ],
    },
];

describe('parseBookFilters', () => {
    test('accepts valid values', () => {
        expect(
            parseBookFilters({
                month: '2027-06',
                days: '6-plus',
                trip: 'white-rim-trail',
            }),
        ).toEqual({
            month: '2027-06',
            days: '6-plus',
            trip: 'white-rim-trail',
        });
    });

    test('drops anything unexpected', () => {
        expect(
            parseBookFilters({
                month: 'June',
                days: '9',
                trip: ['a', 'b'],
            }),
        ).toEqual(NO_FILTERS);
        expect(parseBookFilters({ trip: '../etc' }).trip).toBeNull();
    });
});

describe('bookHref', () => {
    test('writes params in a fixed order and omits empty ones', () => {
        expect(bookHref(NO_FILTERS)).toBe('/book');
        expect(bookHref({ trip: 'yampa-river', month: null, days: '4' })).toBe(
            '/book?days=4&trip=yampa-river',
        );
        expect(bookHref({ month: '2027-07', days: null, trip: null })).toBe(
            '/book?month=2027-07',
        );
    });
});

test('tripParam uses the slug for Sanity groups', () => {
    expect(tripParam('sanity:white-rim-trail')).toBe('white-rim-trail');
    expect(tripParam('arctic:45')).toBe('arctic-45');
});

test('departureLength buckets by whole days', () => {
    expect(departureLength({ duration: '48:00:00' })).toBe('1-3');
    expect(departureLength({ duration: '72:00:00' })).toBe('1-3');
    expect(departureLength({ duration: '96:00:00' })).toBe('4');
    expect(departureLength({ duration: '120:00:00' })).toBe('5');
    expect(departureLength({ duration: '288:00:00' })).toBe('6-plus');
    expect(departureLength({ duration: null })).toBeNull();
});

describe('filterGroups', () => {
    test('no filters keeps everything', () => {
        expect(filterGroups(groups, NO_FILTERS)).toHaveLength(2);
    });

    test('month and length combine, and empty groups drop out', () => {
        const result = filterGroups(groups, {
            month: '2027-05',
            days: '4',
            trip: null,
        });
        expect(result.map((g) => g.key)).toEqual(['sanity:white-rim-trail']);
        expect(result[0].departures.map((d) => d.id)).toEqual([2]);
    });

    test('trip keeps only the matching group', () => {
        const result = filterGroups(groups, {
            ...NO_FILTERS,
            trip: 'arctic-45',
        });
        expect(result.map((g) => g.key)).toEqual(['arctic:45']);
    });
});

test('facetCounts applies the other filters but not its own', () => {
    const counts = facetCounts(
        groups,
        { month: '2027-06', days: '1-3', trip: null },
        'days',
        ['1-3', '4', '5'],
    );
    expect(Object.fromEntries(counts)).toEqual({ '1-3': 1, '4': 0, '5': 1 });
});

test('isPlaceholderCopy catches empty and placeholder text', () => {
    expect(isPlaceholderCopy(null)).toBe(true);
    expect(isPlaceholderCopy('  ')).toBe(true);
    expect(isPlaceholderCopy('[Holiday to write: one-line card tagline]')).toBe(
        true,
    );
    expect(isPlaceholderCopy('World-class whitewater within a weekend.')).toBe(
        false,
    );
});
