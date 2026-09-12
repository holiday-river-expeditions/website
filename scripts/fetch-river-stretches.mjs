#!/usr/bin/env node
/**
 * Pulls the real river geometry for every stretch Holiday runs from the
 * USGS National Hydrography Dataset (NHDPlus HR, public domain, no key)
 * and writes it to src/lib/river-stretches.json for the maps.
 *
 * Each stretch is the named river clipped to a put-in → take-out envelope.
 * NHD flowlines are short directed segments (braids and islands included),
 * so the output is one MultiLineString per stretch rather than a chained
 * path — MapLibre draws it the same either way. Segments are simplified
 * with Douglas–Peucker so the file stays small enough to ship in the
 * bundle.
 *
 * Bike routes (White Rim, Maze) come from the USGS transportation layer
 * (4WD roads) by road name, clipped the same way.
 *
 * Usage:  node scripts/fetch-river-stretches.mjs            # writes the file
 *         node scripts/fetch-river-stretches.mjs --dry-run  # counts only
 *
 * Re-run only when a stretch definition changes — the geometry itself
 * doesn't move. Envelope coordinates are [west, south, east, north].
 */

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const NHD_FLOWLINES =
    'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/3/query';
const USGS_4WD_ROADS =
    'https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/35/query';

/** Degrees; ~60 m at this latitude. Coarse enough to keep the file small,
    fine enough that the line hugs the canyon at zoom 10. */
const TOLERANCE = 0.0006;

const STRETCHES = [
    {
        slug: 'westwater',
        name: 'Westwater Canyon',
        river: 'Colorado River',
        kind: 'raft',
        source: 'nhd',
        // Westwater ranger station to the Cisco take-out.
        bbox: [-109.36, 38.95, -109.05, 39.2],
    },
    {
        slug: 'cataract',
        name: 'Cataract Canyon',
        river: 'Colorado River',
        kind: 'raft',
        source: 'nhd',
        // Potash launch through the Confluence to Hite on Lake Powell.
        bbox: [-110.45, 37.85, -109.55, 38.55],
    },
    {
        slug: 'desolation',
        name: 'Desolation Canyon',
        river: 'Green River',
        kind: 'raft',
        source: 'nhd',
        // Sand Wash down to Swasey's Beach above Green River, Utah.
        bbox: [-110.25, 39.16, -109.85, 39.75],
    },
    {
        slug: 'gates-of-lodore',
        name: 'Gates of Lodore',
        river: 'Green River',
        kind: 'raft',
        source: 'nhd',
        // Lodore launch through Echo Park and Whirlpool Canyon to Split
        // Mountain.
        bbox: [-109.3, 40.42, -108.8, 40.76],
    },
    {
        slug: 'yampa',
        name: 'Yampa River',
        river: 'Yampa River',
        kind: 'raft',
        source: 'nhd',
        // Deerlodge Park to the Green River confluence at Echo Park.
        bbox: [-109.0, 40.4, -108.44, 40.62],
    },
    {
        slug: 'san-juan',
        name: 'San Juan River',
        river: 'San Juan River',
        kind: 'raft',
        source: 'nhd',
        // Sand Island (Bluff) past Mexican Hat to Clay Hills.
        bbox: [-110.45, 37.08, -109.55, 37.36],
    },
    {
        slug: 'san-rafael',
        name: 'San Rafael River',
        river: 'San Rafael River',
        kind: 'raft',
        source: 'nhd',
        // Fuller Bottom through the Little Grand Canyon to the swinging
        // bridge at Buckhorn Wash.
        bbox: [-110.92, 39.02, -110.6, 39.16],
    },
    {
        slug: 'white-rim',
        name: 'White Rim Trail',
        river: null,
        kind: 'bike',
        source: 'roads',
        roadName: 'WHITE RIM',
        bbox: [-110.05, 38.25, -109.65, 38.55],
    },
];

function buildUrl(base, params) {
    const url = new URL(base);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
    }
    return url.toString();
}

async function fetchAll(base, where, bbox) {
    const features = [];
    let offset = 0;
    for (;;) {
        const url = buildUrl(base, {
            where,
            geometry: bbox.join(','),
            geometryType: 'esriGeometryEnvelope',
            inSR: 4326,
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'OBJECTID',
            returnGeometry: true,
            outSR: 4326,
            geometryPrecision: 5,
            f: 'geojson',
            resultOffset: offset,
            resultRecordCount: 2000,
        });
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `${response.status} ${response.statusText}: ${url}`,
            );
        }
        const body = await response.json();
        if (body.error) throw new Error(JSON.stringify(body.error));
        const page = body.features ?? [];
        features.push(...page);
        if (page.length < 2000) break;
        offset += page.length;
    }
    return features;
}

/** Douglas–Peucker on [lon, lat] pairs. */
function simplify(points, tolerance) {
    if (points.length <= 2) return points;
    const [first] = points;
    const last = points[points.length - 1];
    let maxDistance = 0;
    let index = 0;
    for (let i = 1; i < points.length - 1; i += 1) {
        const distance = perpendicular(points[i], first, last);
        if (distance > maxDistance) {
            maxDistance = distance;
            index = i;
        }
    }
    if (maxDistance <= tolerance) return [first, last];
    const left = simplify(points.slice(0, index + 1), tolerance);
    const right = simplify(points.slice(index), tolerance);
    return [...left.slice(0, -1), ...right];
}

function perpendicular([px, py], [ax, ay], [bx, by]) {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
    const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    const cx = ax + Math.max(0, Math.min(1, t)) * dx;
    const cy = ay + Math.max(0, Math.min(1, t)) * dy;
    return Math.hypot(px - cx, py - cy);
}

function inside([lon, lat], [west, south, east, north]) {
    return lon >= west && lon <= east && lat >= south && lat <= north;
}

/** Flattens LineString/MultiLineString features into simplified lines,
    clipped to the envelope so a river that wanders back out of the box
    doesn't drag a tail along with it. */
function toLines(features, bbox) {
    const lines = [];
    for (const feature of features) {
        const geometry = feature.geometry;
        if (!geometry) continue;
        const parts =
            geometry.type === 'MultiLineString'
                ? geometry.coordinates
                : geometry.type === 'LineString'
                  ? [geometry.coordinates]
                  : [];
        for (const part of parts) {
            let run = [];
            for (const point of part) {
                if (inside(point, bbox)) {
                    run.push(point);
                } else if (run.length > 1) {
                    lines.push(run);
                    run = [];
                } else {
                    run = [];
                }
            }
            if (run.length > 1) lines.push(run);
        }
    }
    return lines
        .map((line) => simplify(line, TOLERANCE))
        .map((line) =>
            line.map(([lon, lat]) => [
                Math.round(lon * 1e5) / 1e5,
                Math.round(lat * 1e5) / 1e5,
            ]),
        )
        .filter((line) => line.length > 1);
}

function bounds(lines) {
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;
    for (const line of lines) {
        for (const [lon, lat] of line) {
            west = Math.min(west, lon);
            east = Math.max(east, lon);
            south = Math.min(south, lat);
            north = Math.max(north, lat);
        }
    }
    return [west, south, east, north].map((n) => Math.round(n * 1e4) / 1e4);
}

async function main() {
    const dryRun = process.argv.includes('--dry-run');
    const out = [];
    for (const stretch of STRETCHES) {
        const where =
            stretch.source === 'nhd'
                ? `gnis_name='${stretch.river}'`
                : `UPPER(name) LIKE '%${stretch.roadName}%'`;
        const base = stretch.source === 'nhd' ? NHD_FLOWLINES : USGS_4WD_ROADS;
        const raw = await fetchAll(base, where, stretch.bbox);
        const lines = toLines(raw, stretch.bbox);
        const points = lines.reduce((sum, line) => sum + line.length, 0);
        console.log(
            `${stretch.slug.padEnd(16)} ${String(raw.length).padStart(4)} segments → ${String(lines.length).padStart(4)} lines, ${String(points).padStart(5)} points`,
        );
        if (lines.length === 0) {
            console.warn(`  ! no geometry for ${stretch.slug}; skipped`);
            continue;
        }
        out.push({
            type: 'Feature',
            properties: {
                slug: stretch.slug,
                name: stretch.name,
                river: stretch.river,
                kind: stretch.kind,
                bounds: bounds(lines),
            },
            geometry: { type: 'MultiLineString', coordinates: lines },
        });
    }
    const collection = { type: 'FeatureCollection', features: out };
    const json = JSON.stringify(collection);
    console.log(
        `\n${out.length} stretches, ${(json.length / 1024).toFixed(0)} KB`,
    );
    if (dryRun) return;
    const target = resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../src/lib/river-stretches.json',
    );
    writeFileSync(target, `${json}\n`);
    console.log(`wrote ${target}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
