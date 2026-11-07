import { expect, test } from '@playwright/test';

/**
 * Per-browser demo flags: real visitors always get the defaults (no
 * panel); a browser armed via /admin gets the floating overlay and can
 * flip a flag live, persisting across reloads without a flash of the
 * default. Since 2026-11-06 the only flag is finder-logic; the logo, hero,
 * header, trip page and map flags graduated to defaults.
 */

const PILL = { name: 'Open demo flags panel' };
const ATTR = 'html[data-demo-finder-logic="on"]';

test('default visitor sees the classic logo and no demo panel', async ({
    page,
}) => {
    await page.goto('/');

    const header = page.getByRole('banner');
    const footer = page.locator('footer');
    await expect(header.locator('[data-logo="classic"]')).toBeVisible();
    await expect(footer.locator('[data-logo="classic"]')).toBeVisible();

    await expect(page.getByRole('button', PILL)).toHaveCount(0);
    await expect(page.locator(ATTR)).toHaveCount(0);
});

test('/admin arms the overlay and a flag flips live', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('/');

    // Armed: the collapsed pill is present; expand it.
    const pill = page.getByRole('button', PILL);
    await expect(pill).toBeVisible();
    await pill.click();

    await page
        .getByRole('checkbox', { name: /Trip finder logic panel/ })
        .check();
    await expect(page.locator(ATTR)).toHaveCount(1);

    // Survives reload with the attribute present before paint: the inline
    // head script sets it at document parse time, so it is already there
    // at domcontentloaded.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator(ATTR)).toHaveCount(1);

    // Reset all: back to defaults, still armed.
    await page.getByRole('button', PILL).click();
    await page.getByRole('button', { name: 'Reset all' }).click();
    await expect(page.locator(ATTR)).toHaveCount(0);

    // Disarm: panel gone, storage cleared.
    await page.getByRole('button', { name: 'Disarm' }).click();
    await expect(page.getByRole('button', PILL)).toHaveCount(0);
    const stored = await page.evaluate(() => localStorage.getItem('hre_demo'));
    expect(stored).toBeNull();
});
