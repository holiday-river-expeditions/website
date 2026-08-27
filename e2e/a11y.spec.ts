import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Automated accessibility scan (axe-core, WCAG 2.1 A/AA) across the key
 * page templates. Serious/critical violations fail the build; the full
 * violation list prints on failure for debugging.
 */

const pages = [
    { name: 'home', path: '/' },
    { name: 'trip listing', path: '/trips' },
    { name: 'trip detail', path: '/trips/cataract-canyon' },
    { name: 'specialty hub', path: '/specialty' },
    { name: 'faq', path: '/faq' },
    { name: 'contact', path: '/contact' },
    { name: 'book', path: '/book' },
    { name: 'trip finder', path: '/trip-finder' },
    {
        name: 'trip finder results',
        path: '/trip-finder?who=kids&age=8-12&month=7&days=classic&thrill=splash&activity=raft',
    },
];

for (const { name, path } of pages) {
    test(`${name} (${path}) has no serious accessibility violations`, async ({
        page,
    }) => {
        // Scan the static presentation — reveal transitions produce
        // mid-blend colors that read as false contrast failures.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(path);
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        const serious = results.violations.filter((v) =>
            ['serious', 'critical'].includes(v.impact ?? ''),
        );
        expect(
            serious,
            serious
                .map(
                    (v) =>
                        `${v.id} (${v.impact}): ${v.help} — ${v.nodes
                            .map((n) => n.target.join(' '))
                            .join(', ')}`,
                )
                .join('\n'),
        ).toEqual([]);
    });
}
