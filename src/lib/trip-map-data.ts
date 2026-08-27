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
    kind: 'raft' | 'bike';
    /** Circular photo medallion; falls back to a label-only chip. */
    imageSrc?: string;
}

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
