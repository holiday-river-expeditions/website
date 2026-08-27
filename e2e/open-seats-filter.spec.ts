import { expect, test } from '@playwright/test';

/**
 * Open Seats floating filter bar: month chips are links that filter the
 * list server-side via ?month=, "All dates" clears, and the trip jumper
 * scrolls to a group. Skips gracefully when Arctic has no live data (the
 * bar only renders with trip groups on the page).
 */

test('month chips filter the departures list', async ({ page }) => {
    await page.goto('/open-seats');

    const bar = page.getByRole('navigation', { name: 'Filter departures' });
    if ((await bar.count()) === 0) {
        test.skip(true, 'No live availability — filter bar not rendered');
    }

    // Default state: "All dates" is the current filter.
    await expect(bar.getByRole('link', { name: /All dates/ })).toHaveAttribute(
        'aria-current',
        'true',
    );

    // Pick the first month chip; the page reloads filtered with the chip
    // active, and every month heading in the list matches one month.
    const firstMonth = bar.getByRole('link').nth(1);
    const chipLabel = (await firstMonth.textContent()) ?? '';
    await firstMonth.click();
    await page.waitForURL(/month=\d{4}-\d{2}/);
    await expect(
        page
            .getByRole('navigation', { name: 'Filter departures' })
            .locator('[aria-current="true"]'),
    ).toContainText(chipLabel.replace(/\d+$/, '').trim());
    const headings = await page
        .locator('[data-departure-list] h3')
        .allTextContents();
    expect(new Set(headings.map((h) => h.trim())).size).toBeLessThanOrEqual(1);

    // The jumper only offers groups present under the active filter, so a
    // jump always lands (regression: it listed absent groups before).
    const select = page.getByRole('combobox', { name: 'Jump to trip' });
    if ((await select.count()) > 0) {
        const value = await select
            .locator('option')
            .nth(1)
            .getAttribute('value');
        await select.selectOption(value!);
        await expect(page.locator(`#${value}`)).toBeInViewport();
    }

    // "All dates" clears the filter.
    await page
        .getByRole('navigation', { name: 'Filter departures' })
        .getByRole('link', { name: /All dates/ })
        .click();
    await page.waitForURL((url) => !url.search.includes('month'));
});

test('trip jumper scrolls to the chosen group', async ({ page }) => {
    await page.goto('/open-seats');

    const select = page.getByRole('combobox', { name: 'Jump to trip' });
    if ((await select.count()) === 0) {
        test.skip(true, 'No live availability — trip jumper not rendered');
    }

    const value = await select.locator('option').nth(2).getAttribute('value');
    await select.selectOption(value!);
    await expect(page.locator(`#${value}`)).toBeInViewport();
});
