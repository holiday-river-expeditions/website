'use client';

/* eslint-disable @next/next/no-img-element -- MapLibre markers live
   outside the document flow; next/image's layout machinery buys nothing
   for a fixed 56px medallion and fights the marker transform. */

import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TripMapMarker } from '@/lib/trip-map-data';

/**
 * Homepage trips-map prototype (Aug 20 decision: replace the carousel
 * with a topographic map showing Holiday's Utah/Colorado range). Behind
 * the trips-map demo flag; loaded only via next/dynamic in
 * TripsMapSection so real visitors never download MapLibre (~200 KB).
 *
 * Art direction per Darius (and bikeraft.com's plateau-map anchor):
 * photo medallions per destination over a warm-tinted USGS topo base —
 * the canvas is duotoned toward the brand's sand/earth palette with CSS
 * filters. Basemap: USGS National Map — public domain, no key; swapping
 * to Esri/MapTiler later is a style-URL change.
 *
 * Markers are real <a> elements (keyboard-focusable, axe-clean) and
 * cooperativeGestures stops the map from hijacking page scroll.
 */

const USGS_TOPO_STYLE = {
    version: 8 as const,
    sources: {
        usgs: {
            type: 'raster' as const,
            tiles: [
                'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: 'USGS The National Map',
        },
    },
    layers: [{ id: 'usgs', type: 'raster' as const, source: 'usgs' }],
};

export default function TripsMap({ markers }: { markers: TripMapMarker[] }) {
    return (
        <div
            role='region'
            aria-label='Map of Holiday River Expeditions trips across Utah and Colorado'
            className='overflow-hidden border-4 border-holiday-red/90 [&_canvas]:contrast-[1.02] [&_canvas]:sepia-[0.35] [&_canvas]:saturate-[0.65]'
        >
            <Map
                initialViewState={{
                    longitude: -109.5,
                    latitude: 39.1,
                    zoom: 6,
                }}
                style={{ width: '100%', height: '560px' }}
                mapStyle={USGS_TOPO_STYLE}
                cooperativeGestures
                minZoom={5}
                maxZoom={12}
            >
                {markers.map((marker) => (
                    <Marker
                        key={marker.href}
                        longitude={marker.longitude}
                        latitude={marker.latitude}
                        anchor='bottom'
                    >
                        <a
                            href={marker.href}
                            className='group flex flex-col items-center'
                        >
                            {marker.imageSrc ? (
                                <img
                                    src={marker.imageSrc}
                                    alt=''
                                    width={56}
                                    height={56}
                                    className={`h-14 w-14 rounded-full border-[3px] object-cover shadow-lg transition-transform group-hover:scale-110 group-focus-visible:scale-110 ${
                                        marker.kind === 'raft'
                                            ? 'border-holiday-red'
                                            : 'border-onyx'
                                    }`}
                                />
                            ) : (
                                <span
                                    aria-hidden
                                    className={`h-4 w-4 rounded-full border-2 border-holiday-white shadow-lg ${
                                        marker.kind === 'raft'
                                            ? 'bg-holiday-red'
                                            : 'bg-onyx'
                                    }`}
                                />
                            )}
                            <span
                                className={`mt-1 whitespace-nowrap px-2 py-0.5 font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.05em] shadow-md ${
                                    marker.kind === 'raft'
                                        ? 'bg-holiday-red text-holiday-white'
                                        : 'bg-sand text-onyx'
                                }`}
                            >
                                {marker.label}
                            </span>
                        </a>
                    </Marker>
                ))}
            </Map>
        </div>
    );
}
