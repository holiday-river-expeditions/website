import { expect, test } from '@playwright/test';

/**
 * /book filters: month and length chips are links that filter the list
 * server-side via ?month= and ?days=, the trip select narrows to one trip
 * via ?trip=, and applied filters show as removable chips above the
 * results. Desktop viewport, so the filters are in the sidebar. Skips
 * gracefully when Arctic has no live data (filters only render with trip
 * groups on the page).
 */

test('month chips filter the departures list', async ({ page }) => {
    await page.goto('/book');

    const filters = page.getByRole('complementary', { name: 'Filter dates' });
    if ((await filters.count()) === 0) {
        test.skip(true, 'No live availability, filters not rendered');
    }
    const month = filters.getByRole('group', { name: 'Month' });

    // Default state: "Any month" is the current filter.
    await expect(
        month.getByRole('link', { name: 'Any month' }),
    ).toHaveAttribute('aria-current', 'true');

    // Pick the first month chip; the page reloads filtered with the chip
    // active, and every listed date falls in that month.
    const firstMonth = month.getByRole('link').nth(1);
    const chipLabel = ((await firstMonth.textContent()) ?? '')
        .replace(/\d+$/, '')
        .trim();
    await firstMonth.click();
    await page.waitForURL(/month=\d{4}-\d{2}/);
    await expect(month.locator('[aria-current="true"]')).toContainText(
        chipLabel,
    );
    const shortMonth = chipLabel.slice(0, 3);
    const dates = await page
        .locator('[data-departure-list] li')
        .evaluateAll((rows) =>
            rows.map((row) => row.textContent?.slice(0, 3) ?? ''),
        );
    expect(dates.length).toBeGreaterThan(0);
    expect(new Set(dates)).toEqual(new Set([shortMonth]));

    // The applied filter shows above the results and removes in one click.
    await page.getByRole('link', { name: /remove filter/ }).click();
    await page.waitForURL((url) => !url.search.includes('month'));
});

test('trip select narrows the list to one trip', async ({ page }) => {
    await page.goto('/book');

    const select = page.getByRole('combobox', { name: 'Trip' });
    if ((await select.count()) === 0) {
        test.skip(true, 'No live availability, trip select not rendered');
    }

    const value = await select.locator('option').nth(1).getAttribute('value');
    await select.selectOption(value!);
    await page.waitForURL(new RegExp(`trip=${value}`));
    await expect(page.locator('article[data-availability]')).toHaveCount(1);
});
