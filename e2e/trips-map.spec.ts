import { expect, test } from '@playwright/test';

/**
 * Homepage trips-map prototype behind the trips-map demo flag: default
 * visitors get the featured-trips grid and never load MapLibre; flagged
 * browsers get the map with photo-medallion markers replacing the grid.
 * Skips when the environment has no WebGL (MapLibre can't render).
 */

test('trips-map flag swaps the featured grid for the map', async ({ page }) => {
    // Default visitor: grid visible, no map region in the DOM.
    await page.goto('/');
    await expect(page.locator('[data-reveal-stagger]').first()).toBeVisible();
    await expect(
        page.getByRole('region', { name: /Map of Holiday River/ }),
    ).toHaveCount(0);

    const hasWebgl = await page.evaluate(
        () => !!document.createElement('canvas').getContext('webgl2'),
    );
    if (!hasWebgl) {
        test.skip(true, 'No WebGL in this environment');
    }

    // Arm + enable the flag the same way the init script reads it.
    await page.addInitScript(() => {
        localStorage.setItem(
            'hre_demo',
            JSON.stringify({ armed: true, flags: { 'trips-map': true } }),
        );
    });
    await page.goto('/');

    const map = page.getByRole('region', { name: /Map of Holiday River/ });
    await expect(map).toBeVisible();
    // Markers are real links; the Sanity-authored rivers should be there.
    await expect(map.getByRole('link', { name: /Cataract/ })).toBeVisible();
    // The grid is hidden while the map is on.
    await expect(page.locator('[data-reveal-stagger]').first()).toBeHidden();

    // Let tiles paint, then capture proof for review.
    await page.waitForTimeout(2500);
    await map.screenshot({ path: 'test-results/trips-map-proto.png' });
});
