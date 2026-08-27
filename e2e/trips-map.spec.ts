import { expect, test } from '@playwright/test';

/**
 * The homepage trips map (public since 2026-08-27, replacing the river
 * carousel below the Dee story): lazy-mounts on approach, Relief style
 * by default with Style/Scale/Fly-to controls, marker context cards
 * reachable per WCAG 1.4.13. Skips when the environment has no WebGL.
 */

test('homepage trips map renders with controls and reachable cards', async ({
    page,
}) => {
    const hasWebgl = await page.evaluate(
        () => !!document.createElement('canvas').getContext('webgl2'),
    );
    if (!hasWebgl) {
        test.skip(true, 'No WebGL in this environment');
    }

    await page.goto('/');
    // Lazy-mounted: scroll the section into range and the map appears.
    await page
        .locator(
            'img[alt="Dee Holladay, founder of Holiday River Expeditions"]',
        )
        .scrollIntoViewIfNeeded()
        .catch(() => page.mouse.wheel(0, 2000));
    const map = page.getByRole('region', { name: /Map of Holiday River/ });
    await map.scrollIntoViewIfNeeded();
    await expect(map).toBeVisible();

    // Relief is the default style; the controls are public.
    await expect(map.getByRole('button', { name: 'Relief' })).toHaveAttribute(
        'aria-pressed',
        'true',
    );
    await expect(map.getByLabel(/Fly to/)).toBeVisible();

    // Verified outposts render alongside river medallions.
    await expect(map.getByRole('link', { name: /Vernal HQ/ })).toBeVisible();

    // Hover context card stays open long enough to reach and use its link.
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
    await map.screenshot({ path: 'test-results/trips-map-public.png' });
});
