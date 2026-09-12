import { expect, test } from 'vitest';
import {
    PLATEAU_OUTLINE,
    RIVER_STRETCHES,
    riverKey,
    stretchBySlug,
} from './map-style';

test('every homepage-map section with a river has drawn geometry', () => {
    for (const slug of [
        'westwater',
        'cataract',
        'desolation',
        'gates-of-lodore',
        'yampa',
        'san-juan',
        'san-rafael',
        'white-rim',
    ]) {
        const stretch = stretchBySlug(slug);
        expect(stretch, slug).toBeDefined();
        expect(stretch?.geometry.coordinates.length).toBeGreaterThan(0);
        const [west, south, east, north] = stretch!.properties.bounds;
        expect(west).toBeLessThan(east);
        expect(south).toBeLessThan(north);
    }
});

test('stretches carry a key colour and bike routes are their own kind', () => {
    for (const feature of RIVER_STRETCHES.features) {
        expect(feature.properties.color).toMatch(/^#[0-9a-f]{6}$/);
        expect(feature.properties.swatch).toMatch(/^bg-/);
    }
    expect(stretchBySlug('white-rim')?.properties.kind).toBe('bike');
    expect(stretchBySlug('cataract')?.properties.kind).toBe('raft');
    // Both Colorado stretches share the Colorado colour.
    expect(stretchBySlug('cataract')?.properties.color).toBe(
        stretchBySlug('westwater')?.properties.color,
    );
});

test('the river key lists each river once, and the plateau outline closes', () => {
    const key = riverKey();
    expect(new Set(key.map((k) => k.river)).size).toBe(key.length);
    expect(key.map((k) => k.river)).toContain('Green River');
    const ring = PLATEAU_OUTLINE.geometry.coordinates;
    expect(ring[0]).toEqual(ring[ring.length - 1]);
});
