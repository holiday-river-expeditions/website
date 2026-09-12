import stretches from './river-stretches.json';

/**
 * Shared map plumbing for the homepage trips map and the trip-page map:
 * the USGS basemap styles, the river-stretch geometry (fetched from the
 * National Hydrography Dataset by scripts/fetch-river-stretches.mjs), the
 * per-river key colours, and the rough Colorado Plateau outline.
 *
 * Imported only from the lazily loaded map chunks, so none of this — the
 * 72 KB of geometry included — reaches the critical path.
 */

/** Builds a MapLibre raster style from one or more USGS National Map
    services, layered in order — all public domain, no API key. */
export function usgsStyle(services: string[]) {
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

/** Basemap options. Tint is per-style: the warm duotone flatters line
    maps but muddies imagery. Relief first — Darius picked it as the
    default (parchment terrain, italic river labels, no road clutter). */
export const MAP_STYLES = {
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
export type MapStyleKey = keyof typeof MAP_STYLES;

/**
 * One colour per river so the key reads at a glance (Lauren, Sep 3:
 * highlight the stretch itself and give the rivers a key). Brand tokens
 * only; the white casing under every line keeps the lighter ones legible
 * on parchment. Bike routes share the onyx and dash instead.
 */
export interface KeyColor {
    /** Hex for MapLibre paint, which can't read Tailwind classes. */
    hex: string;
    /** The same token as a Tailwind background class, for legend swatches. */
    swatch: string;
}

export const RIVER_COLORS: Record<string, KeyColor> = {
    'Colorado River': { hex: '#d00a0b', swatch: 'bg-holiday-red' },
    'Green River': { hex: '#3f786b', swatch: 'bg-teal' },
    'Yampa River': { hex: '#0a332d', swatch: 'bg-evergreen' },
    'San Juan River': { hex: '#2c2b29', swatch: 'bg-onyx' },
    'San Rafael River': { hex: '#d6b588', swatch: 'bg-sand' },
};
export const BIKE_ROUTE_COLOR: KeyColor = { hex: '#2c2b29', swatch: 'bg-onyx' };
const DEFAULT_COLOR = RIVER_COLORS['Colorado River'];

export interface StretchProperties {
    slug: string;
    name: string;
    river: string | null;
    kind: 'raft' | 'bike';
    /** [west, south, east, north] */
    bounds: [number, number, number, number];
    /** Hex, read by the line layers via ['get', 'color']. */
    color: string;
    /** Tailwind class for the legend swatch. */
    swatch: string;
}

export interface StretchFeature {
    type: 'Feature';
    properties: StretchProperties;
    geometry: { type: 'MultiLineString'; coordinates: number[][][] };
}

export interface StretchCollection {
    type: 'FeatureCollection';
    features: StretchFeature[];
}

/** Every stretch with its key colour stamped onto the properties, so the
    line layers can read `['get', 'color']` instead of carrying a lookup. */
export const RIVER_STRETCHES: StretchCollection = {
    type: 'FeatureCollection',
    features: stretches.features.map((feature) => {
        const properties = feature.properties as Omit<
            StretchProperties,
            'color' | 'swatch' | 'kind' | 'bounds'
        > & { kind: string; bounds: number[] };
        const color =
            properties.kind === 'bike'
                ? BIKE_ROUTE_COLOR
                : (RIVER_COLORS[properties.river ?? ''] ?? DEFAULT_COLOR);
        return {
            type: 'Feature',
            properties: {
                ...properties,
                kind: properties.kind === 'bike' ? 'bike' : 'raft',
                bounds: properties.bounds as [number, number, number, number],
                color: color.hex,
                swatch: color.swatch,
            },
            geometry: feature.geometry as StretchFeature['geometry'],
        };
    }),
};

export function stretchBySlug(slug: string): StretchFeature | undefined {
    return RIVER_STRETCHES.features.find(
        (feature) => feature.properties.slug === slug,
    );
}

/** Rivers that actually have drawn stretches, in key order, for legends. */
export function riverKey(): Array<{ river: string; swatch: string }> {
    const seen = new Set<string>();
    const key: Array<{ river: string; swatch: string }> = [];
    for (const feature of RIVER_STRETCHES.features) {
        const river = feature.properties.river;
        if (!river || seen.has(river)) continue;
        seen.add(river);
        key.push({ river, swatch: feature.properties.swatch });
    }
    return key;
}

/**
 * A deliberately rough outline of the Colorado Plateau — the province
 * every Holiday trip runs inside (Lauren, Sep 3: "draw a big line around
 * the rough boundary"). Hand-traced from the physiographic province
 * maps; it's a gesture, not a survey.
 */
export const PLATEAU_OUTLINE = {
    type: 'Feature' as const,
    properties: { name: 'Colorado Plateau' },
    geometry: {
        type: 'LineString' as const,
        coordinates: [
            [-112.4, 39.6],
            [-111.5, 40.3],
            [-110.4, 40.9],
            [-109.1, 41.0],
            [-108.1, 40.4],
            [-107.4, 39.5],
            [-107.0, 38.5],
            [-106.8, 37.4],
            [-106.6, 36.3],
            [-106.9, 35.3],
            [-107.9, 34.6],
            [-109.5, 34.4],
            [-111.0, 34.8],
            [-111.9, 35.2],
            [-112.9, 36.0],
            [-113.3, 37.0],
            [-113.0, 38.2],
            [-112.4, 39.6],
        ],
    },
};
