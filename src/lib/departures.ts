import type { ArcticDeparture, ArcticTripType } from '@/lib/arctic';

/**
 * Pure presentation logic for Arctic departures: date math, month grouping,
 * variant detection, and display-name cleanup. Kept free of fetching/JSX so
 * every edge case is directly unit-testable.
 *
 * All date math is UTC-based on Arctic's YYYY-MM-DD strings — departures
 * have no meaningful time component, so UTC keeps grouping stable across
 * server timezones and DST.
 */

const monthFormat = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: 'UTC',
});

const dayFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
});

/** Arctic serializes duration as "HH:MM:SS" (e.g. "120:00:00" = 5 days). */
export function durationToHours(
    duration: string | null | undefined,
): number | null {
    if (!duration) return null;
    const hours = Number(duration.split(':')[0]);
    return Number.isFinite(hours) && hours > 0 ? hours : null;
}

export function durationToDays(
    duration: string | null | undefined,
): number | null {
    const hours = durationToHours(duration);
    return hours ? Math.max(1, Math.round(hours / 24)) : null;
}

/** "Aug 10 – Aug 15" from a start date and Arctic duration. */
export function formatDateRange(
    start: string,
    duration: string | null | undefined,
): string {
    const startDate = new Date(`${start}T00:00:00Z`);
    if (Number.isNaN(startDate.getTime())) return start;
    const days = durationToDays(duration);
    if (!days || days === 1) return dayFormat.format(startDate);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + days - 1);
    return `${dayFormat.format(startDate)} – ${dayFormat.format(endDate)}`;
}

const longDayFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
});

/**
 * "Sep 12, 2026" from a bare YYYY-MM-DD — for Sanity-authored dates that
 * carry no Arctic duration. Returns the input unchanged when unparseable.
 */
export function formatDayLabel(date: string): string {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return date;
    return longDayFormat.format(parsed);
}

export interface DepartureMonthGroup {
    /** e.g. "August" */
    monthLabel: string;
    year: number;
    /** True when the overall list spans multiple years (render the year). */
    showYear: boolean;
    departures: ArcticDeparture[];
}

/**
 * Groups chronologically-sorted departures into month buckets. Invalid
 * start dates land in a trailing "Other dates" bucket rather than vanishing.
 */
export function groupDeparturesByMonth(
    departures: ArcticDeparture[],
): DepartureMonthGroup[] {
    const groups = new Map<string, DepartureMonthGroup>();
    const invalid: ArcticDeparture[] = [];

    for (const departure of departures) {
        const date = new Date(`${departure.start}T00:00:00Z`);
        if (Number.isNaN(date.getTime())) {
            invalid.push(departure);
            continue;
        }
        const year = date.getUTCFullYear();
        const key = `${year}-${date.getUTCMonth()}`;
        let group = groups.get(key);
        if (!group) {
            group = {
                monthLabel: monthFormat.format(date),
                year,
                showYear: false,
                departures: [],
            };
            groups.set(key, group);
        }
        group.departures.push(departure);
    }

    const result = [...groups.values()];
    const years = new Set(result.map((g) => g.year));
    if (years.size > 1) {
        for (const group of result) group.showYear = true;
    }
    if (invalid.length > 0) {
        result.push({
            monthLabel: 'Other dates',
            year: 0,
            showYear: false,
            departures: invalid,
        });
    }
    return result;
}

/** First departure a guest can actually grab (has seats). */
export function nextAvailable(
    departures: ArcticDeparture[],
): ArcticDeparture | null {
    return (
        departures.find((d) => (d.remainingopenings ?? 0) > 0 && !d.canceled) ??
        null
    );
}

export interface DepartureVariant {
    triptypeid: number;
    /** e.g. "5-Day" — or the cleaned type name when durations collide. */
    label: string;
}

/**
 * Distinct trip types present in a departure list, labeled for filter chips.
 * Prefers "N-Day" labels derived from duration; falls back to cleaned type
 * names when two variants share a duration.
 */
export function detectVariants(
    departures: ArcticDeparture[],
    tripTypes?: Pick<ArcticTripType, 'id' | 'name' | 'orname' | 'duration'>[],
): DepartureVariant[] {
    const byType = new Map<number, ArcticDeparture>();
    for (const departure of departures) {
        if (departure.triptypeid && !byType.has(departure.triptypeid)) {
            byType.set(departure.triptypeid, departure);
        }
    }
    if (byType.size < 2) return [];

    const typeInfo = new Map(tripTypes?.map((t) => [t.id, t]) ?? []);
    const variants: DepartureVariant[] = [...byType.entries()].map(
        ([triptypeid, departure]) => {
            const info = typeInfo.get(triptypeid);
            const days = durationToDays(info?.duration ?? departure.duration);
            return {
                triptypeid,
                label: days
                    ? `${days}-Day`
                    : cleanTypeName(
                          info?.name ?? departure.name ?? `Trip ${triptypeid}`,
                          info?.orname,
                      ),
            };
        },
    );

    // Duration collision (e.g. two distinct 3-day products): fall back to
    // cleaned names so chips stay distinguishable.
    const labels = new Set(variants.map((v) => v.label));
    if (labels.size < variants.length) {
        for (const variant of variants) {
            const info = typeInfo.get(variant.triptypeid);
            const source = info?.orname ?? info?.name;
            if (source) variant.label = cleanTypeName(source);
        }
    }

    return variants.sort((a, b) => a.label.localeCompare(b.label));
}

export interface DepartureCallout {
    /** Short badge text, e.g. "With The Pickpockets". */
    label: string;
    /** Optional detail line under the date. */
    note?: string | null;
    /** Parent page for the specialty family, when one exists. */
    href?: string | null;
}

/**
 * Specialty callouts keyed by Arctic departure start date (YYYY-MM-DD).
 * Authored in Sanity as trip.specialtyDepartures.
 */
export type DepartureCalloutMap = ReadonlyMap<string, DepartureCallout>;

/** One trip.specialtyDepartures entry, as projected by any of our queries. */
export interface SpecialtyDepartureEntry {
    startDate?: string | null;
    label?: string | null;
    note?: string | null;
    specialtyType?: {
        slug?: { current?: string | null } | null;
    } | null;
}

/**
 * Indexes specialty callouts by start date so DepartureList can look each
 * row up in O(1).
 *
 * Sanity holds the join as a date rather than an Arctic departure id —
 * editors know "Sept 12 is the bluegrass trip", they do not know id 4417,
 * and ids are reissued each season (see the field description in
 * schemas/trip.ts). The cost is that a date typo silently renders no
 * callout, and that two departures starting the same day cannot be told
 * apart: the first entry wins and later duplicates are ignored.
 */
export function buildCalloutMap(
    entries: readonly SpecialtyDepartureEntry[] | null | undefined,
): DepartureCalloutMap {
    const map = new Map<string, DepartureCallout>();
    for (const entry of entries ?? []) {
        const startDate = entry.startDate?.trim();
        const label = entry.label?.trim();
        // Both are required in the Studio, but drafts and older documents
        // can still arrive incomplete.
        if (!startDate || !label || map.has(startDate)) continue;
        const slug = entry.specialtyType?.slug?.current;
        map.set(startDate, {
            label,
            note: entry.note ?? null,
            // Anchor into the family's section on the specialty hub — the
            // per-family parent pages were removed (Aug 20 decision).
            href: slug ? `/specialty#${slug}` : null,
        });
    }
    return map;
}

/**
 * Cleans an Arctic trip-type name for public display: prefers the
 * online-reservation name (orname) Holiday configured, title-cases
 * lowercase "day" suffixes, and strips internal markers.
 */
export function cleanTypeName(name: string, orname?: string | null): string {
    const source = orname?.trim() || name;
    return source
        .replace(/^Z[- ]+\d{4}\s*/i, '') // legacy "Z- 2024 " prefixes
        .replace(/\b(\d+)\s*day\b/gi, '$1 Day')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Month filtering for the Open Seats filter bar. Months are compared as
 * "YYYY-MM" prefixes of Arctic's start strings — no Date parsing, no
 * timezone to get wrong.
 */

export interface MonthOption {
    /** "YYYY-MM" filter value, safe for a query param. */
    value: string;
    /** Short display label, e.g. "Sep" or "May '27". */
    label: string;
}

const MONTH_VALUE = /^\d{4}-\d{2}$/;

const shortMonths = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

export function departureMonth(
    start: string | null | undefined,
): string | null {
    const value = start?.slice(0, 7) ?? '';
    return MONTH_VALUE.test(value) ? value : null;
}

/** Validates a ?month= query value; anything unexpected means "no filter". */
export function parseMonthParam(
    raw: string | string[] | undefined,
): string | null {
    return typeof raw === 'string' && MONTH_VALUE.test(raw) ? raw : null;
}

/** Distinct months across all departures, ascending. The year is shown
    only when it differs from the first month's year, keeping chips short. */
export function monthOptions(
    departures: readonly ArcticDeparture[],
): MonthOption[] {
    const values = [
        ...new Set(
            departures
                .map((departure) => departureMonth(departure.start))
                .filter((value): value is string => value !== null),
        ),
    ].sort();
    const firstYear = values[0]?.slice(0, 4);
    return values.map((value) => {
        const monthIndex = Number(value.slice(5, 7)) - 1;
        const year = value.slice(0, 4);
        const label = shortMonths[monthIndex] ?? value;
        return {
            value,
            label: year === firstYear ? label : `${label} '${year.slice(2)}`,
        };
    });
}

/** Departures whose start falls in the given month; null month = all. */
export function filterByMonth<T extends { start?: string | null }>(
    departures: readonly T[],
    month: string | null,
): T[] {
    if (!month) return [...departures];
    return departures.filter(
        (departure) => departureMonth(departure.start) === month,
    );
}
