import { expect, test } from '@playwright/test';

/**
 * Find Your Trip wizard, gated by the trip-finder demo flag: real visitors
 * see no entry points; an armed browser gets the homepage section and the
 * floating pill. The wizard itself is URL-state — every answer is a link
 * that adds one query param — so the flow is asserted through hrefs and
 * URLs, no JS state to wait on.
 */

const PILL = { name: 'Open demo flags panel' };

test('default visitor sees no wizard entry points', async ({ page }) => {
    await page.goto('/');

    // The homepage entry section ships in the markup but stays display:none,
    // and the floating pill and hero CTA variant likewise. (The visible
    // hero CTA also says "Find Your Trip" but points at /trips, so assert
    // on wizard hrefs, not names.)
    await expect(page.locator('a[href^="/trip-finder"]:visible')).toHaveCount(
        0,
    );
    await expect(
        page.getByRole('main').getByRole('link', { name: 'Find Your Trip' }),
    ).toHaveAttribute('href', '/trips');
});

test('armed browser walks the wizard from homepage to results', async ({
    page,
}) => {
    await page.goto('/admin');
    await page.waitForURL('/');
    await page.getByRole('button', PILL).click();
    await page.getByRole('checkbox', { name: /Find Your Trip wizard/ }).check();
    await page.getByRole('button', { name: 'Collapse demo panel' }).click();

    // Homepage section appears; question 1 is inline.
    const entry = page.getByRole('heading', {
        level: 2,
        name: /find your trip/i,
    });
    await expect(entry).toBeVisible();

    // The hero CTA swaps its target to the wizard (label unchanged) — only
    // one of the two shipped anchors is visible, so the role query
    // resolves to the flag variant.
    await expect(
        page.getByRole('main').getByRole('link', { name: 'Find Your Trip' }),
    ).toHaveAttribute('href', '/trip-finder');

    // First click is already an answer, landing on the age follow-up.
    await page.getByRole('link', { name: /bringing kids/i }).click();
    await page.waitForURL('/trip-finder?who=kids');
    await expect(
        page.getByRole('heading', { level: 1, name: /youngest adventurer/i }),
    ).toBeVisible();

    // Back drops the last answer.
    await expect(page.getByRole('link', { name: /back/i })).toHaveAttribute(
        'href',
        '/trip-finder?',
    );

    // Answer through to results. Scoped to main — option labels like
    // "Rafting" also exist in the nav.
    const main = page.getByRole('main');
    await main.getByRole('link', { name: '8–12' }).click();
    await main.getByRole('link', { name: 'July' }).click();
    await main.getByRole('link', { name: /the classic/i }).click();
    await main.getByRole('link', { name: /some splash/i }).click();
    await main.getByRole('link', { name: /^Rafting$/ }).click();

    await page.waitForURL(
        '/trip-finder?who=kids&age=8-12&month=7&days=classic&thrill=splash&activity=raft',
    );
    await expect(
        page.getByRole('heading', { level: 2, name: 'Best Match' }),
    ).toBeVisible();

    // Editable chips: dropping "when" returns to exactly that question.
    await page.getByRole('link', { name: /when: july/i }).click();
    await expect(
        page.getByRole('heading', { level: 1, name: /when can you get away/i }),
    ).toBeVisible();

    // The floating pill follows the visitor off the wizard page.
    await page.goto('/trips');
    await expect(page.locator('a[href="/trip-finder"]')).toBeVisible();
});

test('a shared results URL renders results directly', async ({ page }) => {
    await page.goto(
        '/trip-finder?who=adults&month=skip&days=skip&thrill=big&activity=raft',
    );
    await expect(
        page.getByRole('heading', { level: 2, name: 'Best Match' }),
    ).toBeVisible();
    // The human fallback is always present.
    await expect(
        page.getByRole('link', { name: '801-266-2087' }).last(),
    ).toBeVisible();
});
