'use client';

import dynamic from 'next/dynamic';
import { useDemoFlag } from '@/lib/use-demo-flag';
import type { TripMapMarker } from '@/lib/trip-map-data';

/**
 * Flag-gated mount point for the trips-map prototype. Real visitors
 * (flag off) render nothing and never download the MapLibre bundle;
 * armed browsers with trips-map on get the map, which replaces the
 * featured-trips grid (the grid hides via the same attribute). Marker
 * data (coords + Sanity river photos) is built server-side on the
 * homepage and passed in.
 */

const TripsMap = dynamic(() => import('./TripsMap'), {
    ssr: false,
    loading: () => (
        <div
            aria-hidden
            className='h-[560px] w-full bg-holiday-grey/15 motion-safe:animate-pulse'
        />
    ),
});

export function TripsMapSection({ markers }: { markers: TripMapMarker[] }) {
    const enabled = useDemoFlag('trips-map');
    if (!enabled || markers.length === 0) return null;
    return <TripsMap markers={markers} />;
}
