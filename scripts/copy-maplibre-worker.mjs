#!/usr/bin/env node
/**
 * Copies MapLibre's worker bundle into public/ so the browser can find it.
 *
 * MapLibre 6 resolves its worker as `new URL('./maplibre-gl-worker.mjs',
 * import.meta.url)`, which works when the library is served as a plain
 * file but not from a Next/Turbopack chunk — there is no sibling file at
 * the chunk's URL, the worker 404s, and every GeoJSON or vector layer
 * silently never renders (raster tiles don't need the worker, which is
 * why the homepage map looked fine without it). `setWorkerUrl()` in
 * src/lib/maplibre-worker.ts points MapLibre at the copy made here. The
 * shared chunk comes along because the worker imports it relatively.
 *
 * Runs on install, dev and build (see package.json). public/maplibre/ is
 * gitignored so the copy always matches the installed version.
 */

import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve('maplibre-gl/dist/maplibre-gl.mjs'));
const target = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../public/maplibre',
);
mkdirSync(target, { recursive: true });
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
    copyFileSync(join(dist, file), join(target, file));
}
