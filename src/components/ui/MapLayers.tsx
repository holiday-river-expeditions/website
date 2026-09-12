'use client';

import type { ExpressionSpecification } from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';
import { PLATEAU_OUTLINE, RIVER_STRETCHES } from '@/lib/map-style';

/**
 * The drawn layers both maps share: every river stretch Holiday runs as
 * a coloured line over a white casing, bike routes dashed, and the rough
 * Colorado Plateau outline beneath them. Pure MapLibre layers — no DOM,
 * so nothing here needs to be accessible beyond the legend that names
 * the colours.
 *
 * `emphasize` fattens one stretch and fades the rest (the trip page);
 * `plateau` is off there because the outline is off-screen at that zoom.
 */
export function MapLayers({
    emphasize,
    plateau = true,
}: {
    emphasize?: string;
    plateau?: boolean;
}) {
    const opacity: ExpressionSpecification | number = emphasize
        ? ['case', ['==', ['get', 'slug'], emphasize], 1, 0.35]
        : 1;
    const widthBoost: ExpressionSpecification | number = emphasize
        ? ['case', ['==', ['get', 'slug'], emphasize], 1.6, 1]
        : 1;
    // MapLibre only accepts ['zoom'] inside a top-level interpolate, so
    // the per-feature boost multiplies each stop's output instead of
    // wrapping the interpolation.
    const zoomWidth = (stops: [number, number][]): ExpressionSpecification =>
        [
            'interpolate',
            ['linear'],
            ['zoom'],
            ...stops.flatMap(([zoom, px]) => [zoom, ['*', widthBoost, px]]),
        ] as ExpressionSpecification;
    const width = zoomWidth([
        [5, 2],
        [8, 3.5],
        [12, 7],
    ]);
    const casingWidth = zoomWidth([
        [5, 4],
        [8, 6.5],
        [12, 11],
    ]);

    return (
        <>
            {plateau && (
                <Source id='plateau' type='geojson' data={PLATEAU_OUTLINE}>
                    <Layer
                        id='plateau-line'
                        type='line'
                        paint={{
                            'line-color': '#2c2b29',
                            'line-opacity': 0.45,
                            'line-width': 1.5,
                            'line-dasharray': [4, 3],
                        }}
                        layout={{
                            'line-join': 'round',
                            'line-cap': 'round',
                        }}
                    />
                </Source>
            )}
            <Source id='stretches' type='geojson' data={RIVER_STRETCHES}>
                <Layer
                    id='stretch-casing'
                    type='line'
                    paint={{
                        'line-color': '#fcfcfc',
                        'line-opacity': opacity,
                        'line-width': casingWidth,
                    }}
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                />
                <Layer
                    id='stretch-raft'
                    type='line'
                    filter={['==', ['get', 'kind'], 'raft']}
                    paint={{
                        'line-color': ['get', 'color'],
                        'line-opacity': opacity,
                        'line-width': width,
                    }}
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                />
                <Layer
                    id='stretch-bike'
                    type='line'
                    filter={['==', ['get', 'kind'], 'bike']}
                    paint={{
                        'line-color': ['get', 'color'],
                        'line-opacity': opacity,
                        'line-width': width,
                        'line-dasharray': [2, 1.5],
                    }}
                    layout={{ 'line-join': 'round' }}
                />
            </Source>
        </>
    );
}
