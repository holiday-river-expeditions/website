import { expect, test } from '@playwright/test';
import { CART_COUNT_COOKIE } from '../src/lib/cart-cookie';

/**
 * Mobile header layout regression.
 *
 * The header row (logo + hamburger + cart + BOOK NOW) has no shrinkable
 * element — the wordmark and the CTA pill are both whitespace-nowrap — so
 * once it exceeds the viewport the justify-end right cluster overflows
 * *leftward* and the hamburger lands on top of the wordmark.
 *
 * The cart icon only renders when the cart is non-empty, so these tests
 * seed the count cookie first; without it the row squeaks by and the
 * overlap never reproduces.
 */

test.use({ viewport: { width: 375, height: 812 } });

test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([
        {
            name: CART_COUNT_COOKIE,
            value: '2',
            url: baseURL ?? 'http://localhost:3000',
        },
    ]);
});

test('header row fits its container at 375px', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();

    // Sum the row's children against the space the row actually has. The
    // page's own scrollWidth is not a usable signal here: the right cluster
    // is justify-end, so when it is squeezed it overflows *leftward* over
    // the logo without ever widening the document.
    const { needed, available } = await page.evaluate(() => {
        const row = document.querySelector('header > div') as HTMLElement;
        const style = getComputedStyle(row);
        const gap = parseFloat(style.columnGap) || 0;
        const kids = [...row.children].filter(
            (c) => (c as HTMLElement).offsetParent !== null,
        );
        const needed =
            kids.reduce((sum, c) => sum + (c as HTMLElement).scrollWidth, 0) +
            gap * (kids.length - 1);
        return {
            needed,
            available:
                row.clientWidth -
                parseFloat(style.paddingLeft) -
                parseFloat(style.paddingRight),
        };
    });

    expect(needed).toBeLessThanOrEqual(available);
});

test('hamburger does not overlap the logo at 375px', async ({ page }) => {
    await page.goto('/');

    // Scope to the banner — the footer carries the same logo lockup.
    const header = page.getByRole('banner');
    // Measure the visible classic SVG lockup, not the <a>. The Logo also
    // renders the hidden bold live-text variant (demo flag), so target the
    // horizontal-lockup image rather than the lockup's inner spans — the
    // link itself can compress while content spills beyond its box, so the
    // link's own bounding box would report a clean layout during an overlap.
    const wordmark = header
        .getByRole('link', { name: 'Holiday River Expeditions home' })
        .locator('img[src*="logo-horizontal"]');
    const hamburger = header.getByRole('button', { name: 'Open menu' });
    const cta = header.getByRole('link', { name: 'Book Now' });

    const wordmarkBox = await wordmark.boundingBox();
    const hamburgerBox = await hamburger.boundingBox();
    const ctaBox = await cta.boundingBox();

    expect(wordmarkBox).not.toBeNull();
    expect(hamburgerBox).not.toBeNull();
    expect(ctaBox).not.toBeNull();

    // The hamburger starts after the wordmark ends, and the CTA stays inside
    // the viewport.
    expect(hamburgerBox!.x).toBeGreaterThanOrEqual(
        wordmarkBox!.x + wordmarkBox!.width,
    );
    expect(ctaBox!.x + ctaBox!.width).toBeLessThanOrEqual(375);
});

test('mobile drawer opens below the header at 375px', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');

    // DesktopNav is display:none below lg, so the only nav link in the
    // accessibility tree is the drawer's. Clicking can land before React
    // hydration attaches the handler on cold CI runs (the button exists
    // but does nothing), so retry the click until the drawer answers —
    // this spec flaked twice on main CI exactly that way.
    const drawerLink = header.getByRole('link', { name: 'Rafting' });
    await expect(async () => {
        await page.getByRole('button', { name: 'Open menu' }).click();
        await expect(drawerLink).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });

    const headerBox = await header.boundingBox();
    const linkBox = await drawerLink.boundingBox();
    // Anchored to top-full: the drawer starts at the header's bottom edge.
    expect(linkBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
});
