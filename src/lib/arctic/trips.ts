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

function upcoming(departures: ArcticDeparture[]): ArcticDeparture[] {
    return departures
        .filter((d) => !d.canceled)
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
        console.error(`[arctic] getDeparture(${id}) failed:`, error);
        return null;
    }
}

export async function getTripType(id: string | number) {
    if (!isArcticConfigured()) return null;
    try {
        return await arcticGet(`triptype/${id}`, tripTypeSchema);
    } catch (error) {
        console.error(`[arctic] getTripType(${id}) failed:`, error);
        return null;
    }
}

/**
 * Upcoming departures for one Sanity trip. `arcticTripIds` is the Sanity
 * arcticTripId field: one or more Arctic trip-type ids, comma-separated
 * (a "5/6 Days" product spans two Arctic trip types).
 */
export async function getUpcomingDepartures(
    arcticTripIds: string,
): Promise<ArcticDeparture[] | null> {
    if (!isArcticConfigured()) return null;
    const ids = arcticTripIds
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length === 0) return null;
    try {
        const res = await arcticGet('trip', departureList, {
            // orenable = TRUE excludes private charters (verified live:
            // charter departures carry orenable = false).
            query: `triptypeid IN (${ids.join(', ')}) AND orenable = TRUE AND canceled = FALSE AND start >= "${todayISO()}" ORDER BY start`,
        });
        return upcoming(res.entries);
    } catch (error) {
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
        console.error('[arctic] getBookableTripTypes failed:', error);
        return null;
    }
}

/** All upcoming departures across trip types — the Open Seats page. */
export async function getAllUpcomingDepartures(): Promise<
    ArcticDeparture[] | null
> {
    if (!isArcticConfigured()) return null;
    try {
        const res = await arcticGet('trip', departureList, {
            query: `orenable = TRUE AND canceled = FALSE AND start >= "${todayISO()}" ORDER BY start`,
        });
        return upcoming(res.entries);
    } catch (error) {
        console.error('[arctic] getAllUpcomingDepartures failed:', error);
        return null;
    }
}
