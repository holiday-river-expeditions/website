import { expect, test } from '@playwright/test';

/**
 * Per-browser demo flags: real visitors always get the defaults (classic
 * SVG logo lockup, no panel); a browser armed via /admin gets the
 * floating overlay and can flip the logo live, persisting across reloads
 * without a flash of the default variant.
 */

const CLASSIC = 'img[src*="logo-horizontal"]';
const PILL = { name: 'Open demo flags panel' };

test('default visitor sees the classic logo and no demo panel', async ({
    page,
}) => {
    await page.goto('/');

    const header = page.getByRole('banner');
    const footer = page.locator('footer');
    await expect(header.locator(CLASSIC)).toBeVisible();
    await expect(footer.locator(CLASSIC)).toBeVisible();
    // The bold live-text lockup ships in the HTML but stays display:none.
    await expect(
        header.getByText('Holiday River', { exact: false }),
    ).toBeHidden();

    await expect(page.getByRole('button', PILL)).toHaveCount(0);
    await expect(page.locator('html[data-demo-logo-bold]')).toHaveCount(0);
});

test('/admin arms the overlay and the logo flips live', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('/');

    // Armed: the collapsed pill is present; expand it.
    const pill = page.getByRole('button', PILL);
    await expect(pill).toBeVisible();
    await pill.click();

    const header = page.getByRole('banner');
    const checkbox = page.getByRole('checkbox', {
        name: /Bold live-text logo/,
    });

    // Flip ON: bold lockup appears in place, classic hides — no navigation.
    await checkbox.check();
    await expect(header.locator(CLASSIC)).toBeHidden();
    await expect(
        header.getByText('Holiday River', { exact: false }),
    ).toBeVisible();

    // Survives reload with the attribute present before paint: the inline
    // head script sets it at document parse time, so it is already there
    // at domcontentloaded.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html[data-demo-logo-bold="on"]')).toHaveCount(1);
    await expect(
        header.getByText('Holiday River', { exact: false }),
    ).toBeVisible();

    // Reset all: back to defaults, still armed.
    await page.getByRole('button', PILL).click();
    await page.getByRole('button', { name: 'Reset all' }).click();
    await expect(header.locator(CLASSIC)).toBeVisible();

    // Disarm: panel gone, storage cleared.
    await page.getByRole('button', { name: 'Disarm' }).click();
    await expect(page.getByRole('button', PILL)).toHaveCount(0);
    const stored = await page.evaluate(() => localStorage.getItem('hre_demo'));
    expect(stored).toBeNull();
});
