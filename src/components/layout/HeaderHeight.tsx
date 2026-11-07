'use client';

import { useEffect } from 'react';

/** Scrolled past this (px), the header condenses. */
const CONDENSE_AT = 40;
/** Back above this (px), it opens up again. The gap between the two keeps
    it from flickering when a scroll comes to rest near one line. */
const EXPAND_AT = 8;

/**
 * Two jobs for the sticky header. Renders nothing.
 *
 * 1. Keeps `--site-header-h` on <html> set to the header's real height,
 *    so the trip bar sits flush under it instead of at a guessed offset.
 *    It re-measures on resize, which also covers the condense animation
 *    and the logo font loading.
 * 2. Stamps `data-header-condensed` on <html> once the page is scrolled.
 *    Below md the header uses it to shrink the logo (46px to 32px) and its
 *    padding while you read (Darius, 2026-11-07: the phone logo was too
 *    small, so it is bigger on arrival and slim once you scroll). The
 *    header's own classes keep the page from shifting when it does.
 *
 * Before 2026-11-06 this was HeaderReveal, which also hid the header on
 * scroll down. That went with the header-reveal flag when the sticky
 * header became the default.
 */
export function HeaderHeight() {
    useEffect(() => {
        const root = document.documentElement;
        const header = document.querySelector<HTMLElement>(
            'header[data-site-header]',
        );
        if (!header) return;

        const measure = () =>
            root.style.setProperty(
                '--site-header-h',
                `${header.offsetHeight}px`,
            );
        measure();
        const observer =
            typeof ResizeObserver === 'undefined'
                ? null
                : new ResizeObserver(measure);
        observer?.observe(header);

        let frame = 0;
        const update = () => {
            frame = 0;
            const y = window.scrollY;
            const condensed = root.hasAttribute('data-header-condensed');
            if (!condensed && y > CONDENSE_AT) {
                root.setAttribute('data-header-condensed', '');
            } else if (condensed && y < EXPAND_AT) {
                root.removeAttribute('data-header-condensed');
            }
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            observer?.disconnect();
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
            root.style.removeProperty('--site-header-h');
            root.removeAttribute('data-header-condensed');
        };
    }, []);

    return null;
}
