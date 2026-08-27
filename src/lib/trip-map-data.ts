/**
 * Prototype coordinates for the homepage trips map, keyed by the river
 * doc's slug. Hardcoded for the demo; the production version stores
 * lat/lng on the river (or trip) documents in Sanity so editors own it
 * (see research/map-libraries.md).
 */

export interface TripMapMarker {
    label: string;
    href: string;
    longitude: number;
    latitude: number;
    kind: 'raft' | 'bike' | 'outpost';
    /** Circular photo medallion; falls back to a plain dot. */
    imageSrc?: string;
    /** One-to-two sentences shown in the hover/focus context card. */
    context?: string;
}

/**
 * Holiday's physical bases. PROTOTYPE DATA — locations and wording need
 * Darius/Holiday's confirmation before this leaves the demo flag.
 */
export const OUTPOST_MARKERS: TripMapMarker[] = [
    {
        label: 'Salt Lake City HQ',
        href: '/contact',
        longitude: -111.865,
        latitude: 40.688,
        kind: 'outpost',
        imageSrc: '/logo-icon-red.svg',
        context:
            'Headquarters — bookings, planning help, and the crew who answer the phone.',
    },
    {
        label: 'Green River Outpost',
        href: '/contact',
        longitude: -110.16,
        latitude: 38.995,
        kind: 'outpost',
        imageSrc: '/logo-icon-red.svg',
        context:
            'River-side base for Desolation, Labyrinth, and Cataract launches — check-in, gear, and shuttles.',
    },
];

export const TRIP_MAP_COORDS: Record<
    string,
    { longitude: number; latitude: number; kind: 'raft' | 'bike' }
> = {
    'gates-of-lodore': { longitude: -108.89, latitude: 40.73, kind: 'raft' },
    yampa: { longitude: -108.54, latitude: 40.46, kind: 'raft' },
    desolation: { longitude: -110.06, latitude: 39.36, kind: 'raft' },
    westwater: { longitude: -109.13, latitude: 39.14, kind: 'raft' },
    cataract: { longitude: -109.94, latitude: 38.13, kind: 'raft' },
    'san-juan': { longitude: -109.68, latitude: 37.23, kind: 'raft' },
    'san-rafael': { longitude: -110.66, latitude: 39.08, kind: 'raft' },
    'white-rim': { longitude: -109.79, latitude: 38.42, kind: 'bike' },
    maze: { longitude: -110.16, latitude: 38.25, kind: 'bike' },
};
