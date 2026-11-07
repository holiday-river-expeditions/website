import { expect, test } from '@playwright/test';

/**
 * Section menu (TripBar, the default since 2026-11-06): one bar under the
 * banner, sticky under the sticky header. Tabs from lg up (xl on the
 * specialty hub); below that a button naming the section in view opens a
 * sheet of every section. Trip pages add a See dates jump.
 */

const SHEET = '[popover][aria-label="Sections on this page"]';

test('desktop tabs jump to sections', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/trips/cataract-canyon');
    const nav = page.getByRole('navigation', { name: 'Trip sections' });

    await expect(nav.getByRole('link', { name: 'Trip Details' })).toBeVisible();
    await nav.getByRole('link', { name: 'Dates & Availability' }).click();
    await expect(page.locator('#dates-and-rates')).toBeInViewport();
});

test('phone section button opens the sheet and the sheet jumps and closes', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/trips/cataract-canyon');
    const nav = page.getByRole('navigation', { name: 'Trip sections' });

    // Find Your Trip lives in the sheet on phones, so the floating pill
    // steps aside.
    await expect(nav.getByRole('link', { name: 'See dates' })).toBeVisible();
    await expect(
        page
            .locator('a[href="/trip-finder"]:not([data-trip-bar] a)')
            .filter({ hasText: 'Find Your Trip' }),
    ).toBeHidden();

    await nav.getByRole('button', { name: /Sections on this page/ }).click();
    const sheet = page.locator(SHEET);
    await expect(
        sheet.getByRole('link', { name: 'Find Your Trip' }),
    ).toBeVisible();

    await sheet.getByRole('link', { name: 'Dates & Availability' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.locator('#dates-and-rates')).toBeInViewport();
});

test('specialty sheet lists every family', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/specialty');
    const nav = page.getByRole('navigation', {
        name: 'Specialty trip families',
    });

    await nav.getByRole('button', { name: /Sections on this page/ }).click();
    const first = page.locator(SHEET).getByRole('link').first();
    await expect(first).toBeVisible();
    const target = await first.getAttribute('href');
    await first.click();
    await expect(page.locator(target!)).toBeInViewport();
});
