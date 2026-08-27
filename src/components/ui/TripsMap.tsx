'use client';

/* eslint-disable @next/next/no-img-element -- MapLibre markers live
   outside the document flow; next/image's layout machinery buys nothing
   for a fixed 56px medallion and fights the marker transform. */

import { useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TripMapMarker } from '@/lib/trip-map-data';

/**
 * Homepage trips-map prototype (Aug 20 decision) behind the trips-map
 * demo flag — it replaces the river-selector carousel below the Dee
 * story. Loaded only via next/dynamic in TripsMapSection so real
 * visitors never download MapLibre (~200 KB).
 *
 * Art direction per Darius (and bikeraft.com's plateau-map anchor):
 * photo medallions for destinations, the brand mark for Holiday's
 * outposts, over warm-tinted public-domain USGS topo. Hover/focus on a
 * marker opens a context card (progressive disclosure: the card adds
 * detail, the click remains the primary action and works without ever
 * seeing the card — touch users tap straight through). Markers are
 * real <a> elements, keyboard-focusable, and the card opens on focus
 * too, so the detail layer isn't pointer-only.
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

/**
 * The map's border IS a full-width oar: shaft spanning edge to edge and
 * hugging it flush, handle and paddle at the ends, bottom mirrored.
 * (The small centered-oar exploration read as floating clutter at real
 * size — a full-width oar reads as a deliberate rule, the way the old
 * site used its oar dividers.) pointer-events-none: pure ornament.
 */
function OarEdge({ position }: { position: 'top' | 'bottom' }) {
    return (
        // Straddles the map edge exactly: the row's centerline (the shaft)
        // sits ON the edge via the half-translate, half over the map and
        // half over the page. Lives on the unclipped outer wrapper — inside
        // the overflow-hidden map box the shaft could only ever float a few
        // pixels inside the edge.
        <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 z-30 flex items-center ${
                position === 'top'
                    ? 'top-0 -translate-y-1/2'
                    : 'bottom-0 translate-y-1/2 -scale-x-100'
            }`}
        >
            <img src='/oar-handle.svg' alt='' className='h-[13px] w-auto' />
            <span className='mx-[-1px] h-[8px] flex-1 bg-holiday-red' />
            <img src='/oar-paddle.svg' alt='' className='h-[24px] w-auto' />
        </div>
    );
}

function markerRing(kind: TripMapMarker['kind']): string {
    if (kind === 'raft') return 'border-holiday-red';
    if (kind === 'bike') return 'border-onyx';
    return 'border-holiday-grey/60 bg-holiday-white p-1';
}

function markerChip(kind: TripMapMarker['kind']): string {
    if (kind === 'raft') return 'bg-holiday-red text-holiday-white';
    if (kind === 'bike') return 'bg-sand text-onyx';
    return 'bg-holiday-white text-onyx border border-holiday-grey/40';
}

export default function TripsMap({ markers }: { markers: TripMapMarker[] }) {
    const [active, setActive] = useState<TripMapMarker | null>(null);
    // Custom expand instead of the Fullscreen API control: a CSS takeover
    // always works (the API control silently no-ops in embedded/iframe
    // contexts), and an explicit labelled button beats an icon mystery.
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
        if (!expanded) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [expanded]);
    // Hoverable-card contract (WCAG 1.4.13): the card must survive the
    // pointer travelling from marker to card, so closing is delayed and
    // cancelled when the pointer (or focus) lands on the card itself.
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const show = (marker: TripMapMarker) => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setActive(marker);
    };
    const scheduleHide = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setActive(null), 200);
    };
    const holdOpen = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
    };
    useEffect(() => {
        // Dismissible without moving the pointer (WCAG 1.4.13).
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActive(null);
                setExpanded(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, []);

    return (
        <div className='relative'>
            {/* Hidden while expanded: the map box is fixed to the viewport
                then, and the oars would be orphaned at the collapsed spot. */}
            {!expanded && (
                <>
                    <OarEdge position='top' />
                    <OarEdge position='bottom' />
                </>
            )}
            <div
                role='region'
                aria-label='Map of Holiday River Expeditions trips and outposts across Utah and Colorado'
                className={`overflow-hidden [&_canvas]:contrast-[1.02] [&_canvas]:sepia-[0.35] [&_canvas]:saturate-[0.65] ${
                    expanded
                        ? 'fixed inset-0 z-[90]'
                        : 'relative h-[70vh] max-h-[800px] min-h-[500px]'
                }`}
            >
                <Map
                    initialViewState={{
                        longitude: -110.1,
                        latitude: 39.2,
                        zoom: 6.3,
                    }}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle={USGS_TOPO_STYLE}
                    cooperativeGestures
                    minZoom={5}
                    maxZoom={12}
                >
                    {/* Conventional affordances (NN/g: don't rely on scroll or
                    pinch alone — cooperative gestures gate them anyway).
                    Fullscreen is the "expandable" ask via the platform
                    control users already know. */}
                    <NavigationControl
                        position='top-right'
                        showCompass={false}
                    />
                    {markers.map((marker) => (
                        // Bike areas hang BELOW their point while everything
                        // else stacks above — de-collides the Cataract / Maze /
                        // White Rim cluster at the initial zoom.
                        <Marker
                            key={`${marker.kind}-${marker.href}-${marker.label}`}
                            longitude={marker.longitude}
                            latitude={marker.latitude}
                            anchor={marker.kind === 'bike' ? 'top' : 'bottom'}
                        >
                            <a
                                href={marker.href}
                                className='group flex flex-col items-center'
                                onMouseEnter={() => show(marker)}
                                onMouseLeave={scheduleHide}
                                onFocus={() => show(marker)}
                                onBlur={scheduleHide}
                            >
                                {marker.imageSrc ? (
                                    <img
                                        src={marker.imageSrc}
                                        alt=''
                                        width={56}
                                        height={56}
                                        className={`h-14 w-14 rounded-full border-[3px] object-cover shadow-lg transition-transform group-hover:scale-110 group-focus-visible:scale-110 ${markerRing(marker.kind)}`}
                                    />
                                ) : (
                                    <span
                                        aria-hidden
                                        className={`h-4 w-4 rounded-full border-2 border-holiday-white shadow-lg ${
                                            marker.kind === 'bike'
                                                ? 'bg-onyx'
                                                : 'bg-holiday-red'
                                        }`}
                                    />
                                )}
                                <span
                                    className={`mt-1 whitespace-nowrap px-2 py-0.5 font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.05em] shadow-md ${markerChip(marker.kind)}`}
                                >
                                    {marker.label}
                                </span>
                            </a>
                        </Marker>
                    ))}

                    {active?.context && (
                        <Popup
                            longitude={active.longitude}
                            latitude={active.latitude}
                            anchor='top'
                            offset={14}
                            closeButton={false}
                            closeOnClick={false}
                            maxWidth='280px'
                            className='[&_.maplibregl-popup-content]:border [&_.maplibregl-popup-content]:border-holiday-grey/40 [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:shadow-lg'
                        >
                            <div
                                className='bg-holiday-white p-3'
                                onMouseEnter={holdOpen}
                                onMouseLeave={scheduleHide}
                                onFocus={holdOpen}
                                onBlur={scheduleHide}
                            >
                                <p className='font-alt-gothic text-[14px] font-semibold uppercase tracking-[0.04em] text-onyx'>
                                    {active.label}
                                </p>
                                <p className='mt-1 text-[13px] leading-snug text-onyx'>
                                    {active.context}
                                </p>
                                <a
                                    href={active.href}
                                    className='mt-1.5 block text-[12px] font-bold uppercase tracking-[0.05em] text-holiday-red underline transition-opacity hover:opacity-70'
                                >
                                    {active.kind === 'outpost'
                                        ? 'Contact us'
                                        : 'Explore trips'}{' '}
                                    →
                                </a>
                            </div>
                        </Popup>
                    )}

                    {/* Explicit expand/collapse — labelled text button, not an
                    icon mystery; Escape also collapses. */}
                    <button
                        type='button'
                        aria-pressed={expanded}
                        onClick={() => setExpanded((prev) => !prev)}
                        className='absolute right-2.5 top-[84px] z-10 border border-holiday-grey/40 bg-holiday-white px-2.5 py-1.5 font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.05em] text-onyx shadow-md transition-colors hover:text-holiday-red'
                    >
                        {expanded ? 'Collapse map' : 'Expand map'}
                    </button>

                    {/* Legend: three marker kinds is past the point where the
                    chips alone orient a scanner. Kept tiny, inside the Map
                    container so it survives expansion. */}
                    <div className='pointer-events-none absolute left-3 top-3 z-10 border border-holiday-grey/40 bg-holiday-white/95 px-3 py-2 shadow-md'>
                        <ul className='space-y-1.5'>
                            <li className='flex items-center gap-2'>
                                <span
                                    aria-hidden
                                    className='h-3 w-3 rounded-full bg-holiday-red'
                                />
                                <span className='font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.05em] text-onyx'>
                                    Rafting
                                </span>
                            </li>
                            <li className='flex items-center gap-2'>
                                <span
                                    aria-hidden
                                    className='h-3 w-3 rounded-full bg-onyx'
                                />
                                <span className='font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.05em] text-onyx'>
                                    Biking
                                </span>
                            </li>
                            <li className='flex items-center gap-2'>
                                <img
                                    src='/logo-icon-red.svg'
                                    alt=''
                                    width={12}
                                    height={12}
                                    className='h-3 w-auto'
                                />
                                <span className='font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.05em] text-onyx'>
                                    Outpost
                                </span>
                            </li>
                        </ul>
                    </div>
                </Map>
            </div>
        </div>
    );
}
