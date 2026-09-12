'use client';

import dynamic from 'next/dynamic';
import type { TripMapMarker } from '@/lib/trip-map-data';
import { useInView } from '@/lib/use-in-view';

/**
 * Mount point for the homepage trips map (graduated from the trips-map
 * demo flag 2026-08-27 — it replaced the river-selector carousel per
 * the Aug 20 decision). The MapLibre bundle (~200 KB) stays off the
 * critical path twice over: next/dynamic splits it out, and the import
 * only fires once the section scrolls within 600px of the viewport.
 * Marker data (coords + Sanity river photos) is built server-side on
 * the homepage and passed in.
 */

const TripsMap = dynamic(() => import('./TripsMap'), {
    ssr: false,
    loading: () => <MapPlaceholder />,
});

function MapPlaceholder() {
    return (
        <div
            aria-hidden
            className='h-[70vh] max-h-[800px] min-h-[500px] w-full bg-holiday-grey/15 motion-safe:animate-pulse'
        />
    );
}

export function TripsMapSection({ markers }: { markers: TripMapMarker[] }) {
    const { ref, inView } = useInView<HTMLDivElement>('600px');

    if (markers.length === 0) return null;
    return (
        <div ref={ref}>
            {inView ? <TripsMap markers={markers} /> : <MapPlaceholder />}
        </div>
    );
}
