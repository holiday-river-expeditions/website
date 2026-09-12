'use client';

import dynamic from 'next/dynamic';
import type { TripMapProps } from '@/components/ui/TripMap';
import { useInView } from '@/lib/use-in-view';

/**
 * Mount point for the trip-page map, beside the quick facts. Same
 * double deferral as the homepage map: next/dynamic splits MapLibre out
 * of the page bundle and the import only fires once the map scrolls
 * within reach — on most viewports that is immediately, since the facts
 * sit just under the banner, but the page's HTML never waits on it.
 */

const TripMap = dynamic(() => import('./TripMap'), {
    ssr: false,
    loading: () => <MapPlaceholder />,
});

function MapPlaceholder() {
    return (
        <div
            aria-hidden
            className='h-full min-h-[320px] w-full border border-onyx/20 bg-holiday-grey/15 motion-safe:animate-pulse'
        />
    );
}

export function TripMapSection(props: TripMapProps) {
    const { ref, inView } = useInView<HTMLDivElement>('400px');

    return (
        <div ref={ref} className='aspect-[4/3] w-full lg:aspect-auto lg:h-full'>
            {inView ? <TripMap {...props} /> : <MapPlaceholder />}
        </div>
    );
}
