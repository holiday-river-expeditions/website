import type { ArcticDeparture, ArcticTripType } from '@/lib/arctic';
import { SPECIALTY_SLUG_FORMAT } from '@/lib/specialty-slug-format';

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

/** Departures a guest can actually grab (has seats), soonest first. */
export function openDepartures(
    departures: ArcticDeparture[],
): ArcticDeparture[] {
    return departures.filter(
        (d) => (d.remainingopenings ?? 0) > 0 && !d.canceled,
    );
}

/** First departure a guest can actually grab (has seats). */
export function nextAvailable(
    departures: ArcticDeparture[],
): ArcticDeparture | null {
    return openDepartures(departures)[0] ?? null;
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
 * Short length label per trip type ("3-Day"), for row tags and the /book
 * card header. Multi-type lists use detectVariants (which handles duration
 * collisions); a single-type list gets its one duration label.
 */
export function variantLabelMap(
    departures: ArcticDeparture[],
    tripTypes?: Pick<ArcticTripType, 'id' | 'name' | 'orname' | 'duration'>[],
): Map<number, string> {
    const variants = detectVariants(departures, tripTypes);
    if (variants.length > 0) {
        return new Map(variants.map((v) => [v.triptypeid, v.label]));
    }
    const first = departures.find((d) => d.triptypeid);
    const days = durationToDays(first?.duration);
    return first?.triptypeid && days
        ? new Map([[first.triptypeid, `${days}-Day`]])
        : new Map();
}

/** Distinct labels from variantLabelMap, shortest trip first. */
export function sortedVariantLabels(
    labels: ReadonlyMap<number, string>,
): string[] {
    const days = (label: string) => Number.parseInt(label, 10) || Infinity;
    return [...new Set(labels.values())].sort(
        (a, b) => days(a) - days(b) || a.localeCompare(b),
    );
}

export interface DepartureCallout {
    /** Short badge text, e.g. "With The Pickpockets". */
    label: string;
    /** Optional detail line under the date. */
    note?: string | null;
    /** The date's own page, else the family's section on /specialty. */
    href?: string | null;
}

/**
 * Specialty callouts for a trip's departure rows. A date tied to one Arctic
 * departure is keyed `id:<departure id>`, so a regular trip that starts the
 * same day gets no badge. A date known only by its day (a Sanity entry with
 * no tagged departure to match) is keyed by its start date (YYYY-MM-DD).
 * Look rows up with calloutFor.
 */
export type DepartureCalloutMap = ReadonlyMap<string, DepartureCallout>;

/** The map key for a specialty entry: its Arctic departure, else its day. */
function calloutKey(
    entry: Pick<SpecialtyDepartureEntry, 'arcticDepartureId'>,
    startDate: string,
): string {
    return entry.arcticDepartureId != null
        ? `id:${entry.arcticDepartureId}`
        : startDate;
}

/** The callout for one departure row, by departure id first, then by day. */
export function calloutFor(
    callouts: DepartureCalloutMap | null | undefined,
    departure: Pick<ArcticDeparture, 'id' | 'start'>,
): DepartureCallout | undefined {
    return (
        callouts?.get(`id:${departure.id}`) ?? callouts?.get(departure.start)
    );
}

/** A Sanity image as our queries project it (hotspot and crop ride along). */
export interface SpecialtyImage {
    asset?: { _ref?: string };
    alt?: string | null;
}

/** One trip.specialtyDepartures entry, as projected by any of our queries. */
export interface SpecialtyDepartureEntry {
    startDate?: string | null;
    label?: string | null;
    note?: string | null;
    image?: SpecialtyImage | null;
    /** Set in the Studio to pin the page URL; otherwise one is derived. */
    slug?: { current?: string | null } | null;
    /** Booked by phone: never matched to an Arctic departure. */
    phoneOnly?: boolean | null;
    /** This date's own price and length, shown in place of Arctic's. */
    priceText?: string | null;
    lengthText?: string | null;
    /**
     * The Arctic departure this date is, when Arctic keywords tagged it
     * (see mergeSpecialtyEntries). Matched by id from then on, so another
     * departure that starts the same day is never mistaken for it.
     */
    arcticDepartureId?: number | null;
    specialtyType?: {
        _id?: string | null;
        name?: string | null;
        slug?: { current?: string | null } | null;
    } | null;
}

/** A specialty family with the Arctic keywords that claim dates for it. */
export interface KeywordFamily {
    _id: string;
    name?: string | null;
    slug?: { current?: string | null } | null;
    arcticKeywords?: readonly string[] | null;
}

const normalizeKeyword = (keyword: string) => keyword.trim().toLowerCase();

/**
 * The family a departure belongs to: the first of `families` (hub order)
 * that lists one of its keywords. Case and spacing are ignored, since the
 * keywords are typed by hand in both Arctic and the Studio.
 */
export function familyForKeywords(
    keywords: readonly string[] | null | undefined,
    families: readonly KeywordFamily[] | null | undefined,
): KeywordFamily | null {
    const tags = new Set((keywords ?? []).map(normalizeKeyword));
    if (tags.size === 0) return null;
    return (
        families?.find((family) =>
            (family.arcticKeywords ?? []).some((keyword) =>
                tags.has(normalizeKeyword(keyword)),
            ),
        ) ?? null
    );
}

/** A specialty date after merging: a Sanity entry, which may have taken
    an Arctic departure id, or a date made from Arctic alone. */
export type MergedSpecialtyEntry<T extends SpecialtyDepartureEntry> =
    (T & { arcticDepartureId?: number | null }) | ArcticSpecialtyEntry;

/** A specialty date made from a tagged Arctic departure. */
export interface ArcticSpecialtyEntry extends SpecialtyDepartureEntry {
    _key: string;
    startDate: string;
    /** The departure's Arctic name, as Holiday wrote it. */
    label: string;
    arcticDepartureId: number;
    specialtyType: KeywordFamily;
    /** Only Sanity entries carry these. Declared so a merged list reads
        them without narrowing. */
    body?: null;
    minAge?: null;
}

/**
 * Specialty dates for one trip from Arctic keywords: one per departure of
 * the trip's types whose keywords name a family. Expects the public lists
 * from lib/arctic (online, not canceled, no charters) and checks the
 * Charter keyword as well, so a private group never shows as a specialty
 * date. The label is the Arctic name with runs of spaces closed up, and
 * nothing else changed, because it is Holiday's own text.
 */
export function arcticSpecialtyEntries(
    departures: readonly ArcticDeparture[] | null | undefined,
    families: readonly KeywordFamily[] | null | undefined,
    typeIds: ReadonlySet<number>,
): ArcticSpecialtyEntry[] {
    if (!families?.length || typeIds.size === 0) return [];
    const entries: ArcticSpecialtyEntry[] = [];
    for (const departure of departures ?? []) {
        if (departure.canceled) continue;
        if (departure.triptypeid == null || !typeIds.has(departure.triptypeid))
            continue;
        const keywords = departure.keywords ?? [];
        if (keywords.some((k) => normalizeKeyword(k) === 'charter')) continue;
        const family = familyForKeywords(keywords, families);
        const label = departure.name?.replace(/\s+/g, ' ').trim();
        if (!family || !label || !departure.start) continue;
        entries.push({
            _key: `arctic-${departure.id}`,
            startDate: departure.start,
            label,
            arcticDepartureId: departure.id,
            specialtyType: family,
        });
    }
    return entries;
}

/**
 * A trip's specialty dates: its Sanity entries, plus the Arctic-tagged
 * dates on days no Sanity entry names. A Sanity entry replaces Arctic's
 * date on the same day (its label, photo and write-up win), and it takes
 * that departure's id, so its badge lands on the right row when another
 * departure starts the same day. A phone-only entry is never tied to a
 * departure. An entry without a date or label claims no day, so it can't
 * hide an Arctic date it would never show itself.
 */
export function mergeSpecialtyEntries<T extends SpecialtyDepartureEntry>(
    sanity: readonly T[] | null | undefined,
    arctic: readonly ArcticSpecialtyEntry[],
): MergedSpecialtyEntry<T>[] {
    const arcticByDate = new Map<string, ArcticSpecialtyEntry>();
    for (const entry of arctic) {
        if (!arcticByDate.has(entry.startDate)) {
            arcticByDate.set(entry.startDate, entry);
        }
    }
    const claimed = new Set<string>();
    const merged: MergedSpecialtyEntry<T>[] = (sanity ?? []).map((entry) => {
        const startDate = entry.startDate?.trim();
        if (!startDate || !entry.label?.trim()) return entry;
        claimed.add(startDate);
        const match = arcticByDate.get(startDate);
        return match && !entry.phoneOnly && entry.arcticDepartureId == null
            ? { ...entry, arcticDepartureId: match.arcticDepartureId }
            : entry;
    });
    for (const entry of arctic) {
        if (!claimed.has(entry.startDate)) merged.push(entry);
    }
    return merged;
}

/** Lowercase words joined by hyphens, with "&" spelled out as "and". */
export function slugifyLabel(text: string): string {
    return text
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/['\u2019]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * The slug of a specialty date's page at /specialty/<slug>. An editor can
 * pin one in the Studio. Without it the slug is the label, the trip and
 * the start date, which is unique because a trip holds one entry per date.
 * A derived slug changes when the label or date is edited, so pin one
 * before sharing a link widely.
 */
export function specialtyDateSlug(
    entry: Pick<SpecialtyDepartureEntry, 'startDate' | 'label' | 'slug'>,
    tripSlug: string | null | undefined,
): string | null {
    // A pin the URL can't carry as written is ignored, so a stray space
    // or ampersand in the Studio never produces a link that 404s.
    const pinned = entry.slug?.current?.trim();
    if (pinned && SPECIALTY_SLUG_FORMAT.test(pinned)) return pinned;
    const startDate = entry.startDate?.trim();
    const label = slugifyLabel(entry.label ?? '');
    if (!startDate || !label || !tripSlug) return null;
    return `${label}-${tripSlug}-${startDate}`;
}

/** Where a specialty date's page lives, or null when it has no slug. */
export function specialtyDateHref(
    entry: Pick<SpecialtyDepartureEntry, 'startDate' | 'label' | 'slug'>,
    tripSlug: string | null | undefined,
): string | null {
    const slug = specialtyDateSlug(entry, tripSlug);
    return slug ? `/specialty/${slug}` : null;
}

/** One trip's entries, as specialtyDateIndexQuery projects them. */
export interface SpecialtyDateIndexTrip {
    tripSlug?: string | null;
    _updatedAt?: string | null;
    entries?:
        readonly (SpecialtyDepartureEntry & { _key?: string | null })[] | null;
}

export interface SpecialtyDatePage {
    slug: string;
    tripSlug: string;
    /** _key of the specialtyDepartures entry on the trip. */
    key: string | null;
    startDate: string;
    updatedAt: string | null;
}

/**
 * Every specialty date that has a page, one per slug. The page route and
 * the sitemap both read this, so the sitemap never lists a page the route
 * would refuse. An entry needs a date and a label. When two entries end
 * up with the same slug (two pins that match, or a second entry on the
 * same date), the first in trip then array order keeps the page and the
 * rest get none. The Studio blocks matching pins, so this is a backstop.
 */
export function specialtyDatePages(
    index: readonly SpecialtyDateIndexTrip[] | null | undefined,
): SpecialtyDatePage[] {
    const bySlug = new Map<string, SpecialtyDatePage>();
    for (const trip of index ?? []) {
        if (!trip.tripSlug) continue;
        for (const entry of trip.entries ?? []) {
            const startDate = entry.startDate?.trim();
            if (!startDate || !entry.label?.trim()) continue;
            const slug = specialtyDateSlug(entry, trip.tripSlug);
            if (!slug || bySlug.has(slug)) continue;
            bySlug.set(slug, {
                slug,
                tripSlug: trip.tripSlug,
                key: entry._key ?? null,
                startDate,
                updatedAt: trip._updatedAt ?? null,
            });
        }
    }
    return [...bySlug.values()];
}

/**
 * A specialty date's name with its family in front ("Canyon Concerts:
 * Pompe & Honey"), for lists outside the family's own section, where a
 * band or theme name alone doesn't say what kind of trip it is (Oct 22
 * sync). The family name is Holiday's own, used as written.
 */
export function specialtyDateTitle(
    label: string,
    typeName: string | null | undefined,
): string {
    const prefix = typeName?.trim();
    return prefix ? `${prefix}: ${label}` : label;
}

/**
 * Indexes specialty callouts so DepartureList can look each row up in
 * O(1) (see calloutFor).
 *
 * Sanity holds the join as a date rather than an Arctic departure id —
 * editors know "Sept 12 is the bluegrass trip", they do not know id 4417,
 * and ids are reissued each season (see the field description in
 * schemas/trip.ts). Dates that Arctic keywords tagged, and Sanity entries
 * merged onto them, carry the departure id instead, so they badge only
 * their own row. A Sanity entry with no tagged departure still matches by
 * day: a date typo renders no callout, and two departures starting that
 * day both get it. The first entry for a key wins.
 *
 * With the trip's slug, each callout links to the date's own page and
 * falls back to the family's section on the hub.
 */
export function buildCalloutMap(
    entries: readonly SpecialtyDepartureEntry[] | null | undefined,
    tripSlug?: string | null,
): DepartureCalloutMap {
    const map = new Map<string, DepartureCallout>();
    for (const entry of entries ?? []) {
        const startDate = entry.startDate?.trim();
        const label = entry.label?.trim();
        // Both are required in the Studio, but drafts and older documents
        // can still arrive incomplete.
        if (!startDate || !label) continue;
        const key = calloutKey(entry, startDate);
        if (map.has(key)) continue;
        // A phone-only date has no row of its own in the list. Badging
        // another departure that happens to start that day would put its
        // name on a trip anyone can book.
        if (entry.phoneOnly) continue;
        const family = entry.specialtyType?.slug?.current;
        map.set(key, {
            label: specialtyDateTitle(label, entry.specialtyType?.name),
            note: entry.note ?? null,
            // The date's own page (Nov 16 decision). Without a trip slug,
            // the family's section on the hub: the per-family parent
            // pages were removed (Aug 20 decision).
            href:
                specialtyDateHref(entry, tripSlug) ??
                (family ? `/specialty#${family}` : null),
        });
    }
    return map;
}

/**
 * DOM id on a specialty departure row in Dates & Availability. A
 * specialty date's page links to it from "See every date".
 */
export function departureAnchor(startDate: string): string {
    return `departure-${startDate}`;
}

/**
 * One trip's specialty dates from both sources: its Sanity entries and the
 * departures of its Arctic types that keywords tag (mergeSpecialtyEntries
 * has the rules). With Arctic down, `departures` is null and only the
 * Sanity entries come back.
 */
export function tripSpecialtyEntries<T extends SpecialtyDepartureEntry>(
    entries: readonly T[] | null | undefined,
    arcticTripId: string | null | undefined,
    departures: readonly ArcticDeparture[] | null | undefined,
    families: readonly KeywordFamily[] | null | undefined,
): MergedSpecialtyEntry<T>[] {
    return mergeSpecialtyEntries(
        entries,
        arcticSpecialtyEntries(
            departures,
            families,
            new Set(parseArcticIds(arcticTripId)),
        ),
    );
}

/**
 * Whether a departure's trip type belongs on the public lists that span
 * trips (/book and the trip finder). A type counts when Arctic has online
 * reservations switched on for it, or when a trip page in Sanity maps to
 * it. The Arctic flag alone hid Yampa: its two types (59, 60) have the
 * flag off while their departures are bookable and show on the Yampa
 * page. A Sanity page is Holiday's own statement that the trip is public.
 * Internal types (staff retreats, office transactions) have neither.
 * Private charters are dropped earlier, per departure.
 *
 * The cost: switching a type off in Arctic no longer hides a trip that
 * has a Sanity page from these lists. Its departures' own online flags
 * still do, which is the rule the trip page has always followed.
 */
export function isPublicTripType(
    typeId: number | null | undefined,
    arcticPublicTypeIds: { has(id: number): boolean },
    sanityTypeIds: { has(id: number): boolean },
): boolean {
    return (
        typeof typeId === 'number' &&
        (arcticPublicTypeIds.has(typeId) || sanityTypeIds.has(typeId))
    );
}

/** Splits Sanity's comma-separated arcticTripId into trip-type ids. */
export function parseArcticIds(raw: string | null | undefined): number[] {
    if (!raw) return [];
    return raw
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((id) => Number.isInteger(id) && id > 0);
}

export interface UpcomingSpecialtyDate {
    startDate: string;
    label: string;
    note: string | null;
    image: SpecialtyImage | null;
    /** The slug pinned in the Studio, when there is one. */
    slug: { current?: string | null } | null;
    /** Booked by phone: never matched to an Arctic departure. */
    phoneOnly: boolean;
    /** This date's own price and length, shown in place of Arctic's. */
    priceText: string | null;
    lengthText: string | null;
    /** The tagged Arctic departure this date is, when there is one. */
    arcticDepartureId: number | null;
}

/**
 * Specialty entries from today on, by date. Same rules as buildCalloutMap
 * (date and label required, first entry for a departure or day wins),
 * so /specialty never lists a date the trip page's departure list won't
 * badge. `today` is YYYY-MM-DD, compared as a string.
 */
export function upcomingSpecialtyDates(
    entries: readonly SpecialtyDepartureEntry[] | null | undefined,
    today: string,
): UpcomingSpecialtyDate[] {
    const byDate = new Map<string, UpcomingSpecialtyDate>();
    for (const entry of entries ?? []) {
        const startDate = entry.startDate?.trim();
        const label = entry.label?.trim();
        if (!startDate || !label) continue;
        const key = calloutKey(entry, startDate);
        if (byDate.has(key) || startDate < today) continue;
        byDate.set(key, {
            startDate,
            label,
            note: entry.note ?? null,
            image: entry.image ?? null,
            slug: entry.slug ?? null,
            phoneOnly: entry.phoneOnly === true,
            priceText: entry.priceText?.trim() || null,
            lengthText: entry.lengthText?.trim() || null,
            arcticDepartureId: entry.arcticDepartureId ?? null,
        });
    }
    return [...byDate.values()].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
    );
}

/** A trip with specialty dates in one family, as the /specialty query projects it. */
export interface SpecialtyDatedTrip {
    _id: string;
    name?: string | null;
    slug?: { current?: string | null } | null;
    startingPrice?: string | null;
    arcticTripId?: string | null;
    /** The trip's first photo, the thumbnail for dates without their own. */
    image?: SpecialtyImage | null;
    entries?: readonly SpecialtyDepartureEntry[] | null;
}

export interface SpecialtyDateRow {
    key: string;
    startDate: string;
    label: string;
    note: string | null;
    tripName: string;
    /** The date's own page, or null when the trip has no slug. */
    href: string | null;
    /** Sanity price, the fallback when Arctic has no fare for the date. */
    startingPrice: string | null;
    /** Booked by phone: `departure` is always null. */
    phoneOnly: boolean;
    /** This date's own price and length, shown in place of Arctic's. */
    priceText: string | null;
    lengthText: string | null;
    /** The matching Arctic departure, or null when Arctic has none. */
    departure: ArcticDeparture | null;
    /** The date's own photo, else the trip's first photo. */
    image: SpecialtyImage | null;
}

/**
 * One row per upcoming specialty date across a family's trips, by date.
 * Each row is matched to its Arctic departure for seats, length, and fare:
 * by id when Arctic tagged the date, else by trip-type id and start date. A row with no match (Arctic down, or
 * the date isn't scheduled there) still renders from Sanity alone.
 */
export function buildSpecialtyDateRows(
    trips: readonly SpecialtyDatedTrip[] | null | undefined,
    departures: readonly ArcticDeparture[] | null,
    today: string,
): SpecialtyDateRow[] {
    const rows: SpecialtyDateRow[] = [];
    for (const trip of trips ?? []) {
        const ids = new Set(parseArcticIds(trip.arcticTripId));
        const slug = trip.slug?.current;
        for (const date of upcomingSpecialtyDates(trip.entries, today)) {
            // A phone-only date is never matched: another departure of
            // the trip can start the same day, and its Book button and
            // fare would be for the wrong trip.
            const departure = date.phoneOnly
                ? null
                : (departures?.find((d) =>
                      date.arcticDepartureId != null
                          ? d.id === date.arcticDepartureId
                          : d.start === date.startDate &&
                            d.triptypeid != null &&
                            ids.has(d.triptypeid),
                  ) ?? null);
            rows.push({
                key: `${trip._id}-${date.arcticDepartureId ?? date.startDate}`,
                ...date,
                tripName: trip.name ?? '',
                href: specialtyDateHref(date, slug),
                startingPrice: trip.startingPrice ?? null,
                departure,
                // An image field with alt text but no upload still falls
                // back to the trip photo.
                image: date.image?.asset?._ref
                    ? date.image
                    : (trip.image ?? null),
            });
        }
    }
    return rows.sort(
        (a, b) =>
            a.startDate.localeCompare(b.startDate) ||
            a.tripName.localeCompare(b.tripName),
    );
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

/** Group key ("sanity:cataract-canyon" / "arctic:123") → DOM-safe anchor id,
    used by /book's floating menu and deep links from the trip finder. */
export function groupAnchor(key: string): string {
    return `trip-${key.replace(/[^a-zA-Z0-9-]/g, '-')}`;
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
