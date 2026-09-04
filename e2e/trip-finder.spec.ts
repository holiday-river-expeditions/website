import { expect, test } from '@playwright/test';

/**
 * Find Your Trip wizard, live for every visitor: the homepage section with
 * question 1 inline, the floating pill, and the wizard itself. The wizard
 * is URL-state — every answer is a link that adds one query param — so the
 * flow is asserted through hrefs and URLs, no JS state to wait on.
 */

const PILL = { name: 'Open demo flags panel' };

test('every visitor sees the wizard entry points', async ({ page }) => {
    await page.goto('/');

    // Homepage section with question 1 inline, and the floating pill.
    await expect(
        page.getByRole('heading', { level: 2, name: /find your trip/i }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: /bringing kids/i }),
    ).toHaveAttribute('href', '/trip-finder?who=kids');
    await expect(page.locator('a[href="/trip-finder"]').first()).toBeVisible();
});

test('walks the wizard from homepage to results', async ({ page }) => {
    await page.goto('/');

    // First click is already an answer, landing on the age follow-up.
    await page.getByRole('link', { name: /bringing kids/i }).click();
    await page.waitForURL('/trip-finder?who=kids');
    await expect(
        page.getByRole('heading', {
            level: 1,
            name: /how old is your youngest/i,
        }),
    ).toBeVisible();

    // Back drops the last answer.
    await expect(page.getByRole('link', { name: /back/i })).toHaveAttribute(
        'href',
        '/trip-finder?',
    );

    // Answer through to results. Scoped to main — option labels like
    // "Rafting" also exist in the nav.
    const main = page.getByRole('main');
    await main.getByRole('link', { name: /8–12/ }).click();
    // Activity comes right after the who step so everything downstream
    // can adapt (bikers never see the whitewater question).
    await main.getByRole('link', { name: /^Rafting/ }).click();
    await main.getByRole('link', { name: /^July/ }).click();
    await main.getByRole('link', { name: /the classic/i }).click();
    await main.getByRole('link', { name: /some splash/i }).click();

    await page.waitForURL(
        '/trip-finder?who=kids&age=8-12&activity=raft&month=7&days=classic&thrill=splash',
    );
    await expect(
        page.getByRole('heading', { level: 1, name: /is calling/i }),
    ).toBeVisible();
    await expect(page.getByText('Best Match', { exact: true })).toBeVisible();

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
    await expect(page.getByText('Best Match', { exact: true })).toBeVisible();
    // The human fallback is always present.
    await expect(
        page.getByRole('link', { name: '801-266-2087' }).last(),
    ).toBeVisible();
});

test('logic panel appears only when its flag is on', async ({ page }) => {
    const heading = page.getByRole('heading', {
        level: 2,
        name: /trip finder logic/i,
    });

    // Ships in the markup, display:none for everyone else.
    await page.goto('/trip-finder?who=kids');
    await expect(heading).toBeHidden();

    await page.goto('/admin');
    await page.waitForURL('/');
    await page.getByRole('button', PILL).click();
    await page
        .getByRole('checkbox', { name: /Trip finder logic panel/ })
        .check();
    await page.getByRole('button', { name: 'Collapse demo panel' }).click();

    // A wizard step: the state table names the current question.
    await page.goto('/trip-finder?who=kids');
    await expect(heading).toBeVisible();
    await expect(
        page.getByText(/now asking: .*how old is your youngest/i),
    ).toBeVisible();

    // Results: the full ranking and the Arctic data-sources section.
    await page.goto(
        '/trip-finder?who=kids&age=8-12&activity=raft&month=7&days=classic&thrill=splash',
    );
    await expect(heading).toBeVisible();
    await expect(page.getByText(/best match threshold/i).first()).toBeVisible();
    await expect(page.getByText(/how every trip scores/i)).toBeVisible();
});
