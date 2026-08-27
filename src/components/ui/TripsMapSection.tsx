'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { TripMapMarker } from '@/lib/trip-map-data';

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
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '600px' },
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    if (markers.length === 0) return null;
    return (
        <div ref={ref}>
            {inView ? <TripsMap markers={markers} /> : <MapPlaceholder />}
        </div>
    );
}
