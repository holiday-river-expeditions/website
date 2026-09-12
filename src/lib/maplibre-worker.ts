import { setWorkerUrl } from 'maplibre-gl';

/**
 * Where scripts/copy-maplibre-worker.mjs puts MapLibre's worker bundle.
 * MapLibre's own lookup (relative to its module URL) breaks under
 * Turbopack, so every map component calls this before mounting a Map.
 * Without it GeoJSON layers — the river stretches — never render.
 */
export const MAPLIBRE_WORKER_URL = '/maplibre/maplibre-gl-worker.mjs';

let configured = false;

export function configureMapLibreWorker(): void {
    if (configured || typeof window === 'undefined') return;
    setWorkerUrl(MAPLIBRE_WORKER_URL);
    configured = true;
}
