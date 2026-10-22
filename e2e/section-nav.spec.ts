import { expect, test } from '@playwright/test';

/**
 * Section menu (Aug 20 decision, reworked Oct 2026): a tab row fixed at
 * the top from lg up, and below lg a bottom dock whose button opens a
 * sheet of every section. Trip pages add a See dates jump.
 */

test('desktop tab row appears in the content and jumps to sections', async ({
    page,
}) => {
    await page.goto('/trips/cataract-canyon');
    const nav = page.getByRole('navigation', { name: 'Trip sections' });
    const tabs = nav.getByRole('link', { name: 'Trip Details' }).first();

    await page.locator('#trip-details').scrollIntoViewIfNeeded();
    await expect(tabs).toBeVisible();

    await nav
        .getByRole('link', { name: 'Dates & Availability' })
        .first()
        .click();
    await expect(page.locator('#dates-and-rates')).toBeInViewport();
});

test('phone dock opens the sheet and the sheet jumps and closes', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/trips/cataract-canyon');
    const nav = page.getByRole('navigation', { name: 'Trip sections' });

    // The dock owns the bottom edge, so the Find Your Trip pill steps
    // aside and lives in the sheet instead.
    await expect(nav.getByRole('link', { name: 'See dates' })).toBeVisible();
    await expect(
        page
            .locator('a[href="/trip-finder"]:not(nav a):not([data-trip-bar] a)')
            .filter({ hasText: 'Find Your Trip' }),
    ).toBeHidden();

    await nav.getByRole('button', { name: 'On this page' }).click();
    const sheet = page.getByRole('dialog', { name: 'Trip sections' });
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

    await nav.getByRole('button').first().click();
    const sheet = page.getByRole('dialog', {
        name: 'Specialty trip families',
    });
    const first = sheet.getByRole('link').first();
    await expect(first).toBeVisible();
    const target = await first.getAttribute('href');
    await first.click();
    await expect(page.locator(target!)).toBeInViewport();
});
