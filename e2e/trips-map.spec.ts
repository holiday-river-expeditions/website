import { expect, test } from '@playwright/test';

/**
 * Homepage trips-map prototype behind the trips-map demo flag: default
 * visitors keep the river-selector carousel (below the Dee story) and
 * never load MapLibre; flagged browsers get the map in its place — the
 * featured-trips grid stays either way. Hover/focus on a marker opens a
 * context card that must remain reachable (WCAG 1.4.13). Skips when the
 * environment has no WebGL.
 */

test('trips-map flag swaps the river carousel for the map', async ({
    page,
}) => {
    // Default visitor: carousel present, no map region in the DOM.
    await page.goto('/');
    await expect(page.getByTestId('river-selector-wrap')).toBeVisible();
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
    // Featured-trips grid STAYS (Darius: only the carousel is replaced).
    await expect(page.locator('[data-reveal-stagger]').first()).toBeVisible();
    await expect(page.getByTestId('river-selector-wrap')).toBeHidden();

    // Outposts and rivers render as real links; the legend orients kinds.
    await expect(
        map.getByRole('link', { name: /Green River Outpost/ }),
    ).toBeVisible();
    await expect(map.getByText('Rafting', { exact: true })).toBeVisible();

    // Hover context card stays open long enough to reach and use its link
    // (Yampa sits clear of the confluence cluster).
    const yampa = map.getByRole('link', { name: /^Yampa$/ });
    await yampa.scrollIntoViewIfNeeded();
    await yampa.hover();
    const cardLink = map.getByRole('link', { name: /Explore trips/ });
    await expect(cardLink).toBeVisible();
    await cardLink.hover();
    await expect(cardLink).toBeVisible();

    // Expand toggle takes the map over the viewport and collapses back.
    await map.getByRole('button', { name: 'Expand map' }).click();
    await expect(
        map.getByRole('button', { name: 'Collapse map' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(map.getByRole('button', { name: 'Expand map' })).toBeVisible();

    // Let tiles paint, then capture proof for review.
    await page.waitForTimeout(2500);
    await map.screenshot({ path: 'test-results/trips-map-proto.png' });
});
