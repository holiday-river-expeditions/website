import type { ArcticDeparture } from '@/lib/arctic';
import { departureMonth, durationToDays } from '@/lib/departures';

/**
 * Filter state for /book: month, trip length and trip, all carried as URL
 * params so the page stays server-rendered and every filtered view is a
 * shareable link. Pure functions only, like departures.ts.
 */

export interface BookFilters {
    /** "YYYY-MM" or null for all months. */
    month: string | null;
    /** A LENGTH_OPTIONS value or null for any length. */
    days: LengthValue | null;
    /** A tripParam() value or null for all trips. */
    trip: string | null;
}

/** One option of a filter, with the dates it would leave. */
export interface BookFilterOption {
    value: string;
    label: string;
    count: number;
}

export const NO_FILTERS: BookFilters = { month: null, days: null, trip: null };

/**
 * Length buckets sized to the catalog (2 to 12 day trips, most of them 4
 * or 5 days), so each bucket narrows the list by a useful amount.
 */
export const LENGTH_OPTIONS = [
    { value: '1-3', label: 'Up to 3 Days', min: 1, max: 3 },
    { value: '4', label: '4 Days', min: 4, max: 4 },
    { value: '5', label: '5 Days', min: 5, max: 5 },
    { value: '6-plus', label: '6+ Days', min: 6, max: Infinity },
] as const;

export type LengthValue = (typeof LENGTH_OPTIONS)[number]['value'];

const MONTH_VALUE = /^\d{4}-\d{2}$/;
const TRIP_VALUE = /^[a-z0-9-]{1,96}$/;

function single(raw: string | string[] | undefined): string | null {
    return typeof raw === 'string' ? raw : null;
}

/** Validates raw search params; anything unexpected means "no filter". */
export function parseBookFilters(params: {
    month?: string | string[];
    days?: string | string[];
    trip?: string | string[];
}): BookFilters {
    const month = single(params.month);
    const days = single(params.days);
    const trip = single(params.trip);
    return {
        month: month && MONTH_VALUE.test(month) ? month : null,
        days: LENGTH_OPTIONS.some((option) => option.value === days)
            ? (days as LengthValue)
            : null,
        trip: trip && TRIP_VALUE.test(trip) ? trip : null,
    };
}

/** /book URL for a filter state. Params are written in a fixed order so
    equal states always produce equal links. */
export function bookHref(filters: BookFilters): string {
    const params = new URLSearchParams();
    if (filters.month) params.set('month', filters.month);
    if (filters.days) params.set('days', filters.days);
    if (filters.trip) params.set('trip', filters.trip);
    const query = params.toString();
    return query ? `/book?${query}` : '/book';
}

/** Group key ("sanity:white-rim-trail" / "arctic:123") → ?trip= value. */
export function tripParam(groupKey: string): string {
    return groupKey.startsWith('sanity:')
        ? groupKey.slice('sanity:'.length)
        : groupKey.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
}

export function departureLength(
    departure: Pick<ArcticDeparture, 'duration'>,
): LengthValue | null {
    const days = durationToDays(departure.duration);
    if (!days) return null;
    return (
        LENGTH_OPTIONS.find(
            (option) => days >= option.min && days <= option.max,
        )?.value ?? null
    );
}

/** Departures matching the month and length filters. The trip filter
    works on whole groups, so filterGroups applies it. */
export function filterDepartures<T extends ArcticDeparture>(
    departures: readonly T[],
    filters: Pick<BookFilters, 'month' | 'days'>,
): T[] {
    return departures.filter(
        (departure) =>
            (!filters.month ||
                departureMonth(departure.start) === filters.month) &&
            (!filters.days || departureLength(departure) === filters.days),
    );
}

interface FilterableGroup {
    key: string;
    departures: ArcticDeparture[];
}

/** Groups narrowed to the filter state, dropping groups left empty. */
export function filterGroups<G extends FilterableGroup>(
    groups: readonly G[],
    filters: BookFilters,
): G[] {
    return groups
        .filter(
            (group) => !filters.trip || tripParam(group.key) === filters.trip,
        )
        .map((group) => ({
            ...group,
            departures: filterDepartures(group.departures, filters),
        }))
        .filter((group) => group.departures.length > 0);
}

function countDepartures(
    groups: readonly FilterableGroup[],
    filters: BookFilters,
): number {
    return filterGroups(groups, filters).reduce(
        (sum, group) => sum + group.departures.length,
        0,
    );
}

/**
 * Departure count for each option of one filter, with the other two
 * filters applied. That is the number a visitor would see after picking
 * the option, so a zero tells them the pick is a dead end before they
 * make it.
 */
export function facetCounts(
    groups: readonly FilterableGroup[],
    filters: BookFilters,
    facet: keyof BookFilters,
    values: readonly string[],
): Map<string, number> {
    return new Map(
        values.map((value) => [
            value,
            countDepartures(groups, { ...filters, [facet]: value }),
        ]),
    );
}

/** True for Sanity copy that is missing or still a "[Holiday to write: …]"
    placeholder, which should never reach a visitor. */
export function isPlaceholderCopy(text: string | null | undefined): boolean {
    const trimmed = text?.trim() ?? '';
    return trimmed === '' || /^\[Holiday to write\b/i.test(trimmed);
}
