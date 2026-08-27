'use client';

/* eslint-disable @next/next/no-img-element -- MapLibre markers live
   outside the document flow; next/image's layout machinery buys nothing
   for a fixed 56px medallion and fights the marker transform. */

import { useEffect, useRef, useState } from 'react';
import Map, {
    Marker,
    NavigationControl,
    Popup,
    type MapRef,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TripMapMarker } from '@/lib/trip-map-data';

/**
 * The homepage trips map (Aug 20 decision) — replaced the river-selector
 * carousel below the Dee story; graduated from the trips-map demo flag
 * 2026-08-27. Loaded only via next/dynamic in TripsMapSection so real
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

/** Builds a MapLibre raster style from one or more USGS National Map
    services, layered in order — all public domain, no API key. */
function usgsStyle(services: string[]) {
    return {
        version: 8 as const,
        sources: Object.fromEntries(
            services.map((service) => [
                service,
                {
                    type: 'raster' as const,
                    tiles: [
                        `https://basemap.nationalmap.gov/arcgis/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`,
                    ],
                    tileSize: 256,
                    attribution: 'USGS The National Map',
                },
            ]),
        ),
        layers: services.map((service) => ({
            id: service,
            type: 'raster' as const,
            source: service,
        })),
    };
}

/** Prototype style options for Darius/Holiday to compare live. Tint is
    per-style: the warm duotone flatters line maps but muddies imagery.
    Relief first — Darius picked it as the default. */
const MAP_STYLES = {
    relief: {
        label: 'Relief',
        style: usgsStyle(['USGSShadedReliefOnly', 'USGSHydroCached']),
        tint: '[&_canvas]:contrast-[1.05] [&_canvas]:sepia-[0.45] [&_canvas]:saturate-[0.9]',
    },
    topo: {
        label: 'Topo',
        style: usgsStyle(['USGSTopo']),
        tint: '[&_canvas]:contrast-[1.02] [&_canvas]:sepia-[0.35] [&_canvas]:saturate-[0.65]',
    },
    satellite: {
        label: 'Satellite',
        style: usgsStyle(['USGSImageryTopo']),
        tint: '',
    },
} as const;
type MapStyleKey = keyof typeof MAP_STYLES;

/** Named sub-regions for the fly-to targeting, grouping the marker
    clusters the way guests think about the geography. */
const MAP_REGIONS = [
    {
        label: 'Dinosaur Country',
        longitude: -108.72,
        latitude: 40.58,
        zoom: 8,
    },
    {
        label: 'Green River Corridor',
        longitude: -110.2,
        latitude: 39.2,
        zoom: 7.8,
    },
    { label: 'Canyonlands', longitude: -109.97, latitude: 38.28, zoom: 8.2 },
    { label: 'San Juan', longitude: -109.68, latitude: 37.25, zoom: 8.4 },
] as const;

/** Scale presets: the whole operating region vs tight on the plateau
    cluster where most trips sit. */
const MAP_VIEWS = {
    region: { label: 'Region', longitude: -110.1, latitude: 39.2, zoom: 6.3 },
    plateau: { label: 'Plateau', longitude: -109.7, latitude: 38.9, zoom: 7.1 },
} as const;
type MapViewKey = keyof typeof MAP_VIEWS;

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
    // Prototype comparison controls: basemap style + scale preset,
    // flippable live so Holiday can judge options side by side.
    const [styleKey, setStyleKey] = useState<MapStyleKey>('relief');
    // null while a fly-to target (river/region) is active instead of a
    // scale preset — the Scale buttons unpress and the select shows it.
    const [viewKey, setViewKey] = useState<MapViewKey | null>('region');
    const [target, setTarget] = useState('');
    const mapRef = useRef<MapRef>(null);
    const flyToPoint = (longitude: number, latitude: number, zoom: number) => {
        mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom,
            duration: 1200,
        });
    };
    const flyTo = (key: MapViewKey) => {
        setViewKey(key);
        setTarget('');
        const view = MAP_VIEWS[key];
        flyToPoint(view.longitude, view.latitude, view.zoom);
    };
    const flyToTarget = (value: string) => {
        setTarget(value);
        if (!value) return;
        setViewKey(null);
        const region = MAP_REGIONS.find((r) => r.label === value);
        if (region) {
            flyToPoint(region.longitude, region.latitude, region.zoom);
            return;
        }
        const marker = markers.find((m) => m.label === value);
        if (marker) flyToPoint(marker.longitude, marker.latitude, 8.6);
    };
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
                className={`overflow-hidden ${MAP_STYLES[styleKey].tint} ${
                    expanded
                        ? 'fixed inset-0 z-[90]'
                        : 'relative h-[70vh] max-h-[800px] min-h-[500px]'
                }`}
            >
                <Map
                    ref={mapRef}
                    initialViewState={MAP_VIEWS.region}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle={MAP_STYLES[styleKey].style}
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

                    {/* Prototype comparison controls (demo-only surface):
                        basemap style and scale presets, live-flippable so
                        Holiday judges options in place instead of from
                        screenshots. */}
                    <div className='absolute left-3 top-[120px] z-10 border border-holiday-grey/40 bg-holiday-white/95 px-3 py-2 shadow-md'>
                        <fieldset>
                            <legend className='font-alt-gothic text-[11px] font-semibold uppercase tracking-[0.08em] text-onyx/70'>
                                Style
                            </legend>
                            <div className='mt-1 flex gap-1'>
                                {(Object.keys(MAP_STYLES) as MapStyleKey[]).map(
                                    (key) => (
                                        <button
                                            key={key}
                                            type='button'
                                            aria-pressed={styleKey === key}
                                            onClick={() => setStyleKey(key)}
                                            className={`px-2 py-1 font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.04em] ${
                                                styleKey === key
                                                    ? 'bg-holiday-red text-holiday-white'
                                                    : 'text-onyx hover:text-holiday-red'
                                            }`}
                                        >
                                            {MAP_STYLES[key].label}
                                        </button>
                                    ),
                                )}
                            </div>
                        </fieldset>
                        <fieldset className='mt-2'>
                            <legend className='font-alt-gothic text-[11px] font-semibold uppercase tracking-[0.08em] text-onyx/70'>
                                Scale
                            </legend>
                            <div className='mt-1 flex gap-1'>
                                {(Object.keys(MAP_VIEWS) as MapViewKey[]).map(
                                    (key) => (
                                        <button
                                            key={key}
                                            type='button'
                                            aria-pressed={viewKey === key}
                                            onClick={() => flyTo(key)}
                                            className={`px-2 py-1 font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.04em] ${
                                                viewKey === key
                                                    ? 'bg-holiday-red text-holiday-white'
                                                    : 'text-onyx hover:text-holiday-red'
                                            }`}
                                        >
                                            {MAP_VIEWS[key].label}
                                        </button>
                                    ),
                                )}
                            </div>
                        </fieldset>
                        <label className='mt-2 block'>
                            <span className='font-alt-gothic text-[11px] font-semibold uppercase tracking-[0.08em] text-onyx/70'>
                                Fly to
                            </span>
                            <select
                                value={target}
                                onChange={(event) =>
                                    flyToTarget(event.target.value)
                                }
                                className='mt-1 block w-full max-w-40 border border-holiday-grey/40 bg-holiday-white px-1.5 py-1 font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.04em] text-onyx'
                            >
                                <option value=''>Anywhere…</option>
                                <optgroup label='Regions'>
                                    {MAP_REGIONS.map((region) => (
                                        <option
                                            key={region.label}
                                            value={region.label}
                                        >
                                            {region.label}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label='Rivers & outposts'>
                                    {markers.map((marker) => (
                                        <option
                                            key={`${marker.kind}-${marker.label}`}
                                            value={marker.label}
                                        >
                                            {marker.label}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </label>
                    </div>

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
