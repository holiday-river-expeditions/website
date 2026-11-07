'use client';

import { useEffect } from 'react';

/** Single reveal targets, plus each child of a staggered grid. Grids reveal
    card by card rather than as one block: a tall grid (six trip cards run
    1,100px on desktop, 2,600px stacked on mobile) only ever peeks a sliver
    into view, so any rule based on how much of the whole grid shows left
    the first row blank until the visitor scrolled. */
const TARGETS =
    'main [data-reveal]:not([data-revealed]), main [data-reveal-stagger] > :not([data-revealed])';

/** Grid children that reveal together step in 0.1s apart, capped at 3. */
const MAX_STEP = 3;

function isInViewport(el: Element): boolean {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return rect.top < window.innerHeight && rect.bottom > 0;
}

/**
 * Site-wide scroll-reveal driver ("life of the river" motion system).
 * Mounted once in the root layout. Server components opt in by adding a
 * `data-reveal` attribute (one element) or `data-reveal-stagger` (each
 * child of a grid), so no client islands multiply.
 *
 * First load: whatever is already on screen when this mounts stays put.
 * The server HTML painted it visible, and hiding it at hydration only to
 * fade it back in reads as a flicker. Motion is for what scrolls into view.
 *
 * Safety gates (both must hold before anything is ever hidden):
 *  1. This component sets `html[data-reveal='on']` at mount, so with no JS
 *     the reveal CSS never applies and content is simply visible.
 *  2. All reveal CSS lives inside prefers-reduced-motion: no-preference.
 */
export function RevealObserver() {
    useEffect(() => {
        const root = document.documentElement;
        if (
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            !('IntersectionObserver' in window)
        ) {
            return;
        }

        // Mark on-screen targets revealed BEFORE switching the CSS on, in
        // the same task, so they never compute as hidden and never animate.
        for (const el of document.querySelectorAll<HTMLElement>(TARGETS)) {
            if (isInViewport(el)) el.dataset.revealed = '';
        }
        root.dataset.reveal = 'on';

        let observerFired = false;
        const observer = new IntersectionObserver(
            (entries) => {
                observerFired = true;
                // Grid siblings arriving together step in left to right.
                const stepByParent = new Map<Element | null, number>();
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const el = entry.target as HTMLElement;
                    if (el.parentElement?.hasAttribute('data-reveal-stagger')) {
                        const step = stepByParent.get(el.parentElement) ?? 0;
                        el.dataset.revealStep = String(
                            Math.min(step, MAX_STEP),
                        );
                        stepByParent.set(el.parentElement, step + 1);
                    }
                    el.dataset.revealed = '';
                    observer.unobserve(el);
                }
            },
            // threshold 0: any pixel inside the zone counts, so an element
            // taller than the viewport still reveals. The bottom margin
            // holds the fade until it has cleared the bottom edge a little.
            { rootMargin: '0px 0px -8% 0px', threshold: 0 },
        );

        // Dead-observer failsafe: in any environment where IO exists but
        // never delivers callbacks (embedded webviews, hidden panes, some
        // emulators), targets would stay hidden. Healthy browsers fire
        // within one frame, so this never affects them.
        const failsafe = setTimeout(() => {
            if (observerFired) return;
            for (const el of document.querySelectorAll<HTMLElement>(TARGETS)) {
                el.dataset.revealed = '';
            }
        }, 3000);

        const observeAll = () => {
            for (const el of document.querySelectorAll(TARGETS)) {
                observer.observe(el);
            }
        };
        observeAll();

        // Client-side navigations swap page content; re-arm on DOM changes.
        const mutations = new MutationObserver(observeAll);
        mutations.observe(document.body, { childList: true, subtree: true });

        return () => {
            clearTimeout(failsafe);
            observer.disconnect();
            mutations.disconnect();
            delete root.dataset.reveal;
        };
    }, []);

    return null;
}
