import { unstable_rethrow } from 'next/navigation';
import { cache } from 'react';
import { arcticGet } from './client';
import { isArcticConfigured } from './config';
import {
    type ArcticDeparture,
    type ArcticTripType,
    departureSchema,
    listEnvelope,
    tripTypeSchema,
} from './types';

/**
 * Read-only availability fetchers. Every function returns null (or []) when
 * Arctic is unconfigured or unreachable so pages can render a "call us"
 * fallback instead of erroring — the site must never 500 because Arctic is
 * down (the integration is unsupported by Arctic; see docs/project/arctic-api.md).
 */

const departureList = listEnvelope(departureSchema);

/** Today's date in Arctic's YYYY-MM-DD convention (Mountain Time). */
function todayISO(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Denver',
    }).format(new Date());
}

/**
 * Private charters are booked by one group and must never show as open
 * seats. Most carry orenable = false, but some are left bookable online in
 * Arctic (eight in 2027, e.g. "Desolation Canyon Shriners Charter"), so the
 * departure name is checked as well.
 */
export function isPrivateCharter(departure: Pick<ArcticDeparture, 'name'>) {
    return /\bcharter\b/i.test(departure.name ?? '');
}

/**
 * Arctic caps a list response at 50 rows whatever `limit` asks for, but a
 * LIMIT clause inside the query gets past the cap (verified live
 * 2026-10-21: `LIMIT 0, 1000` returned all 233 upcoming departures). Page
 * with that clause, stopping at a short page or after MAX_PAGES so a
 * runaway query can't loop forever. Ordering by id as well as start keeps
 * departures that share a date in the same order from page to page, and
 * a departure added mid-fetch can only shift one row onto two pages, which
 * the id check drops.
 */
const PAGE_SIZE = 200;
const MAX_PAGES = 10;

async function queryDepartures(where: string): Promise<ArcticDeparture[]> {
    const byId = new Map<number, ArcticDeparture>();
    for (let page = 0; page < MAX_PAGES; page++) {
        const res = await arcticGet('trip', departureList, {
            query: `${where} ORDER BY start, id LIMIT ${page * PAGE_SIZE}, ${PAGE_SIZE}`,
        });
        for (const d of res.entries) byId.set(d.id, d);
        if (res.entries.length < PAGE_SIZE) return [...byId.values()];
    }
    console.warn(
        `[arctic] stopped paging departures after ${MAX_PAGES * PAGE_SIZE} rows`,
    );
    return [...byId.values()];
}

function upcoming(departures: ArcticDeparture[]): ArcticDeparture[] {
    return departures
        .filter((d) => !d.canceled && !isPrivateCharter(d))
        .sort((a, b) => a.start.localeCompare(b.start));
}

/** Single departure by id (used for the pre-book availability re-check). */
export async function getDeparture(
    id: number,
): Promise<ArcticDeparture | null> {
    if (!isArcticConfigured()) return null;
    try {
        return await arcticGet(`trip/${id}`, departureSchema);
    } catch (error) {
        unstable_rethrow(error);
        console.error(`[arctic] getDeparture(${id}) failed:`, error);
        return null;
    }
}

export async function getTripType(id: string | number) {
    if (!isArcticConfigured()) return null;
    try {
        return await arcticGet(`triptype/${id}`, tripTypeSchema);
    } catch (error) {
        unstable_rethrow(error);
        console.error(`[arctic] getTripType(${id}) failed:`, error);
        return null;
    }
}

/**
 * Upcoming departures for one Sanity trip. `arcticTripIds` is the Sanity
 * arcticTripId field: one or more Arctic trip-type ids, comma-separated
 * (a "5/6 Days" product spans two Arctic trip types).
 *
 * Wrapped in React `cache()` so a trip page and its AvailabilitySection
 * share one Arctic request per render (the page reads the next open dates
 * for the trip bar and facts strip).
 */
export const getUpcomingDepartures = cache(fetchUpcomingDepartures);

async function fetchUpcomingDepartures(
    arcticTripIds: string,
): Promise<ArcticDeparture[] | null> {
    if (!isArcticConfigured()) return null;
    const ids = arcticTripIds
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length === 0) return null;
    try {
        // orenable = TRUE excludes most private charters (they carry
        // orenable = false); upcoming() catches the rest by name.
        const departures = await queryDepartures(
            `triptypeid IN (${ids.join(', ')}) AND orenable = TRUE AND canceled = FALSE AND start >= "${todayISO()}"`,
        );
        return upcoming(departures);
    } catch (error) {
        unstable_rethrow(error);
        console.error(
            `[arctic] getUpcomingDepartures(${arcticTripIds}) failed:`,
            error,
        );
        return null;
    }
}

/**
 * Trip types with online reservations enabled — the public catalog. Used to
 * keep internal Arctic entries (staff retreats, office transactions,
 * charters) off public pages.
 */
export async function getBookableTripTypes(): Promise<ArcticTripType[] | null> {
    if (!isArcticConfigured()) return null;
    try {
        const res = await arcticGet('triptype', listEnvelope(tripTypeSchema), {
            query: 'orenable = TRUE AND deleted = FALSE LIMIT 0, 200',
        });
        return res.entries;
    } catch (error) {
        unstable_rethrow(error);
        console.error('[arctic] getBookableTripTypes failed:', error);
        return null;
    }
}

/** All upcoming departures across trip types, for /book and the trip finder. */
export async function getAllUpcomingDepartures(): Promise<
    ArcticDeparture[] | null
> {
    if (!isArcticConfigured()) return null;
    try {
        const departures = await queryDepartures(
            `orenable = TRUE AND canceled = FALSE AND start >= "${todayISO()}"`,
        );
        return upcoming(departures);
    } catch (error) {
        unstable_rethrow(error);
        console.error('[arctic] getAllUpcomingDepartures failed:', error);
        return null;
    }
}
