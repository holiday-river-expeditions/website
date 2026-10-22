'use client';

import { useEffect } from 'react';
import { useDemoFlag } from '@/lib/use-demo-flag';

/** Scroll distance (px) in one direction before the header reacts. */
const THRESHOLD = 8;
/** Scroll idle time (ms) that ends an in-page jump. */
const JUMP_SETTLE = 150;

/**
 * header-reveal demo flag: the header hides while scrolling down and comes
 * back on any scroll up, so the main nav is never more than a flick away
 * (NN/g's partially persistent header). Renders nothing. It stamps
 * `data-header-hidden` on <html>, and Header, SectionNav and TripBar style
 * themselves from it.
 *
 * With either header flag on it also keeps `--site-header-h` on <html> set
 * to the header's real height (80px on phones, 94px on desktop), so the
 * section menus sit flush under a sticky header instead of at a guessed
 * offset that left a strip of page showing.
 *
 * - Always shown within one header height of the top, and while focus is
 *   inside it, so keyboard users never tab into a hidden header.
 * - An in-page anchor jump hides it and ignores scrolling until the jump
 *   settles, so a jump up the page doesn't land with the header over the
 *   heading it was aiming for.
 * - Off when sticky-header is on, which keeps the header always visible.
 */
export function HeaderReveal() {
    const reveal = useDemoFlag('header-reveal');
    const sticky = useDemoFlag('sticky-header');
    const active = reveal && !sticky;
    const measured = reveal || sticky;

    useEffect(() => {
        const root = document.documentElement;
        const header = document.querySelector<HTMLElement>(
            'header[data-site-header]',
        );
        if (!measured || !header) return;
        // The height changes when the logo font loads and at breakpoints.
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
        return () => {
            observer?.disconnect();
            root.style.removeProperty('--site-header-h');
        };
    }, [measured]);

    useEffect(() => {
        const root = document.documentElement;
        const header = document.querySelector<HTMLElement>(
            'header[data-site-header]',
        );
        if (!active || !header) return;

        let lastY = window.scrollY;
        let jumping = false;
        let settle = 0;

        const setHidden = (hidden: boolean) =>
            root.toggleAttribute('data-header-hidden', hidden);
        const endJumpSoon = () => {
            window.clearTimeout(settle);
            settle = window.setTimeout(() => {
                jumping = false;
                lastY = window.scrollY;
            }, JUMP_SETTLE);
        };

        const onScroll = () => {
            const y = window.scrollY;
            if (jumping) {
                endJumpSoon();
                return;
            }
            if (y <= header.offsetHeight) {
                setHidden(false);
                lastY = y;
                return;
            }
            const delta = y - lastY;
            if (Math.abs(delta) < THRESHOLD) return;
            setHidden(delta > 0 && !header.contains(document.activeElement));
            lastY = y;
        };
        const onClick = (event: MouseEvent) => {
            const link = (event.target as Element | null)?.closest('a');
            if (!link?.getAttribute('href')?.startsWith('#')) return;
            jumping = true;
            setHidden(true);
            endJumpSoon();
        };
        const onFocusIn = (event: FocusEvent) => {
            if (header.contains(event.target as Node)) setHidden(false);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('click', onClick, true);
        document.addEventListener('focusin', onFocusIn);

        return () => {
            window.clearTimeout(settle);
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('focusin', onFocusIn);
            root.removeAttribute('data-header-hidden');
        };
    }, [active]);

    return null;
}
