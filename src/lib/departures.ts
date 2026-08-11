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
