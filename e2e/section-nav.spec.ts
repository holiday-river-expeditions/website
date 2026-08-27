import { expect, test } from '@playwright/test';

/**
 * Floating section menu (Aug 20 decision): trip pages carry Trip Details /
 * FAQs / Rates & Dates stops; the specialty hub lists its families. The
 * bar is a fixed nav of plain anchors, hidden until scroll on trip pages
 * and always visible on the specialty hub.
 */

test('trip page floating menu is visible on load and jumps to sections', async ({
    page,
}) => {
    await page.goto('/trips/cataract-canyon');

    // Always visible (Darius: appearing only after a long scroll hid the
    // navigation exactly when a new visitor needs it), consistent with the
    // specialty hub and /book bars.
    const nav = page.getByRole('navigation', { name: 'Trip sections' });
    await expect(nav).not.toHaveClass(/invisible/);
    await expect(nav.getByRole('link', { name: 'Trip Details' })).toBeVisible();

    // Jumping to Rates & Dates brings the availability section into view.
    await nav.getByRole('link', { name: 'Rates & Dates' }).click();
    await expect(page.locator('#dates-and-rates')).toBeInViewport();
});

test('specialty hub floating menu lists the families and is always visible', async ({
    page,
}) => {
    await page.goto('/specialty');

    const nav = page.getByRole('navigation', {
        name: 'Specialty trip families',
    });
    await expect(nav).not.toHaveClass(/invisible/);

    const first = nav.getByRole('link').first();
    await expect(first).toBeVisible();
    await first.click();
    const target = await first.getAttribute('href');
    await expect(page.locator(target!)).toBeInViewport();
});
