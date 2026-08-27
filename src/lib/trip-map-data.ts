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
 * Holiday's physical bases, per the company's own contact page
 * (bikeraft.com/contact, checked 2026-08-27): the year-round Salt Lake
 * City office plus two seasonal trip headquarters.
 */
export const OUTPOST_MARKERS: TripMapMarker[] = [
    {
        label: 'Salt Lake City Office',
        href: '/contact',
        longitude: -111.878,
        latitude: 40.687,
        kind: 'outpost',
        imageSrc: '/logo-icon-red.svg',
        context:
            'Year-round business office — bookings, planning help, and the crew who answer the phone. 801-266-2087.',
    },
    {
        label: 'Green River HQ',
        href: '/contact',
        longitude: -110.16,
        latitude: 38.995,
        kind: 'outpost',
        imageSrc: '/logo-icon-red.svg',
        context:
            'Seasonal trip headquarters, May–September — meeting point for Green and Colorado River launches. 435-564-3273.',
    },
    {
        label: 'Vernal HQ',
        href: '/contact',
        longitude: -109.529,
        latitude: 40.456,
        kind: 'outpost',
        imageSrc: '/logo-icon-red.svg',
        context:
            'Seasonal trip headquarters, May–September — meeting point for Gates of Lodore and Yampa launches. 435-789-4586.',
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
