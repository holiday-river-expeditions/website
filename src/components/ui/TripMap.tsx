'use client';

/* eslint-disable @next/next/no-img-element -- MapLibre markers and popups
   live outside the document flow; next/image buys nothing for a 44px
   medallion and fights the marker transform. */

import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapLayers } from '@/components/ui/MapLayers';
import { configureMapLibreWorker } from '@/lib/maplibre-worker';
import { MAP_STYLES, stretchBySlug } from '@/lib/map-style';
import { useHoverCard } from '@/lib/use-hover-card';

// Must run before the first Map mounts (see maplibre-worker.ts).
configureMapLibreWorker();

export interface TripMapPoint {
    key: string;
    title: string;
    longitude: number;
    latitude: number;
    imageSrc?: string;
    imageAlt?: string;
    caption?: string;
}

export interface TripMapProps {
    sectionSlug: string;
    sectionName: string;
    /** "Colorado River" — the key line under the map. */
    riverLabel?: string | null;
    /** Fallback centre when the section has no drawn stretch. */
    center?: { longitude: number; latitude: number } | null;
    /** Photo points from the Section document, pinned along the stretch. */
    points: TripMapPoint[];
}

/**
 * The trip-page map (Justin's build-out doc: a map beside the quick facts,
 * with photos of river areas tied to locations; Lauren, Sep 3: more
 * aesthetic and artsy, still interactive). The same parchment Relief
 * basemap as the homepage, framed with a vignette, the trip's own stretch
 * drawn full-strength with every other stretch faded behind it, and the
 * Section's photo points as tappable medallions that open a photo card.
 *
 * Loaded only via next/dynamic in TripMapSection so the trip page's
 * critical path never carries MapLibre.
 */
export default function TripMap({
    sectionSlug,
    sectionName,
    riverLabel,
    center,
    points,
}: TripMapProps) {
    const stretch = stretchBySlug(sectionSlug);
    const { active, show, scheduleHide, holdOpen, toggle } =
        useHoverCard<TripMapPoint>();

    const initialViewState = stretch
        ? {
              bounds: stretch.properties.bounds,
              fitBoundsOptions: { padding: 56 },
          }
        : center
          ? { longitude: center.longitude, latitude: center.latitude, zoom: 9 }
          : { longitude: -110.1, latitude: 39.2, zoom: 6.3 };

    return (
        <div
            role='region'
            aria-label={`Map of the ${sectionName} stretch`}
            className={`relative h-full min-h-[320px] w-full overflow-hidden border border-onyx/20 ${MAP_STYLES.relief.tint}`}
        >
            <Map
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle={MAP_STYLES.relief.style}
                cooperativeGestures
                minZoom={6}
                maxZoom={13}
                attributionControl={false}
            >
                <NavigationControl position='top-right' showCompass={false} />
                {/* Fade the other rivers only when this section has a
                    drawn stretch to stand out; a pin-only section keeps
                    every river at full strength. */}
                <MapLayers
                    emphasize={stretch ? sectionSlug : undefined}
                    plateau={false}
                />

                {points.map((point) => (
                    <Marker
                        key={point.key}
                        longitude={point.longitude}
                        latitude={point.latitude}
                        anchor='bottom'
                    >
                        <button
                            type='button'
                            aria-label={`${point.title} — show photo`}
                            aria-expanded={active?.key === point.key}
                            className='group flex flex-col items-center'
                            onClick={() =>
                                toggle(
                                    point,
                                    (current) => current.key === point.key,
                                )
                            }
                            onMouseEnter={() => show(point)}
                            onMouseLeave={scheduleHide}
                            onFocus={() => show(point)}
                            onBlur={scheduleHide}
                        >
                            {point.imageSrc ? (
                                <img
                                    src={point.imageSrc}
                                    alt=''
                                    width={44}
                                    height={44}
                                    className='h-11 w-11 rounded-full border-[3px] border-holiday-white object-cover shadow-lg transition-transform group-hover:scale-110 group-focus-visible:scale-110'
                                />
                            ) : (
                                <span
                                    aria-hidden
                                    className='h-4 w-4 rounded-full border-2 border-holiday-white bg-holiday-red shadow-lg'
                                />
                            )}
                            <span className='mt-1 whitespace-nowrap bg-holiday-white px-2 py-0.5 font-alt-gothic text-[11px] font-semibold uppercase tracking-[0.05em] text-onyx shadow-md'>
                                {point.title}
                            </span>
                        </button>
                    </Marker>
                ))}

                {active && (
                    <Popup
                        longitude={active.longitude}
                        latitude={active.latitude}
                        anchor='bottom'
                        offset={64}
                        closeButton={false}
                        closeOnClick={false}
                        maxWidth='260px'
                        className='[&_.maplibregl-popup-content]:border [&_.maplibregl-popup-content]:border-holiday-grey/40 [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:shadow-lg'
                    >
                        <figure
                            className='bg-holiday-white'
                            onMouseEnter={holdOpen}
                            onMouseLeave={scheduleHide}
                        >
                            {active.imageSrc && (
                                <img
                                    src={active.imageSrc}
                                    alt={active.imageAlt ?? active.title}
                                    width={240}
                                    height={180}
                                    className='aspect-[4/3] w-full object-cover'
                                />
                            )}
                            <figcaption className='p-3'>
                                <p className='font-alt-gothic text-[14px] font-semibold uppercase tracking-[0.04em] text-onyx'>
                                    {active.title}
                                </p>
                                {active.caption && (
                                    <p className='mt-1 text-[13px] leading-snug text-onyx'>
                                        {active.caption}
                                    </p>
                                )}
                            </figcaption>
                        </figure>
                    </Popup>
                )}
            </Map>

            {/* Parchment vignette: the "artsy" ask without touching the
                data. Ornament only. */}
            <div
                aria-hidden
                className='pointer-events-none absolute inset-0 shadow-[inset_0_0_72px_rgba(44,43,41,0.35)]'
            />

            {/* Key line: what the drawn stretch is. The swatch only
                appears when there is a line for it to describe. */}
            <div className='pointer-events-none absolute bottom-3 left-3 z-10 border border-holiday-grey/40 bg-holiday-white/95 px-3 py-2 shadow-md'>
                <p className='flex items-center gap-2 font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.05em] text-onyx'>
                    {stretch && (
                        <span
                            aria-hidden
                            className={`h-[3px] w-4 rounded-full ${stretch.properties.swatch}`}
                        />
                    )}
                    {sectionName}
                    {riverLabel && riverLabel !== sectionName && (
                        <span className='font-medium text-onyx/70'>
                            · {riverLabel}
                        </span>
                    )}
                </p>
                <p className='mt-0.5 text-[10px] uppercase tracking-[0.08em] text-onyx/70'>
                    USGS The National Map
                </p>
            </div>
        </div>
    );
}
