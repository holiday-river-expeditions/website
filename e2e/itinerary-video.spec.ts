import { expect, test } from '@playwright/test';

/**
 * The "A Day on the River" ambient loop is the site's only auto-starting
 * motion, so its two guarantees get real-browser coverage: it obeys
 * prefers-reduced-motion, and it offers a stop control when it does move
 * (WCAG 2.2.2 — axe cannot check that one).
 *
 * Both tests no-op until a trip actually has itineraryMedia uploaded.
 */
const TRIP = '/trips/cataract-canyon';

test('ambient itinerary video stays paused under reduced motion', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // The real claim is bandwidth, not just stillness: gating happens before
    // the fetch, so a reduced-motion visitor pays nothing for the clip.
    const fileRequests: string[] = [];
    page.on('request', (request) => {
        if (request.url().includes('cdn.sanity.io/files/')) {
            fileRequests.push(request.url());
        }
    });

    await page.goto(TRIP);

    const video = page.locator('section video');
    test.skip(
        (await video.count()) === 0,
        'No trip has itineraryMedia uploaded yet.',
    );

    await video.scrollIntoViewIfNeeded();
    // Give the intersection callback a frame to land — if the gate were
    // broken, this is the window in which playback would start.
    await page.waitForTimeout(500);

    expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(
        true,
    );
    expect(await video.evaluate((el: HTMLVideoElement) => el.src)).toBe('');
    expect(fileRequests).toEqual([]);
    await expect(
        page.getByRole('button', { name: /background video/i }),
    ).toHaveCount(0);
});

test('ambient itinerary video plays and can be paused otherwise', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(TRIP);

    const video = page.locator('section video');
    test.skip(
        (await video.count()) === 0,
        'No trip has itineraryMedia uploaded yet.',
    );

    await video.scrollIntoViewIfNeeded();
    await expect
        .poll(() => video.evaluate((el: HTMLVideoElement) => el.paused))
        .toBe(false);

    const toggle = page.getByRole('button', { name: 'Pause background video' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect
        .poll(() => video.evaluate((el: HTMLVideoElement) => el.paused))
        .toBe(true);
    await expect(
        page.getByRole('button', { name: 'Play background video' }),
    ).toBeVisible();
});
