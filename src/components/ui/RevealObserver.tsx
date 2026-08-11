'use client';

import { useEffect } from 'react';

/**
 * Site-wide scroll-reveal driver ("life of the river" motion system).
 * Mounted once in the root layout. Server components opt in by adding a
 * `data-reveal` attribute — no client islands multiply.
 *
 * Safety gates (both must hold before anything is ever hidden):
 *  1. This component sets `html[data-reveal='on']` at mount — no JS means
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
        root.dataset.reveal = 'on';

        let observerFired = false;
        const observer = new IntersectionObserver(
            (entries) => {
                observerFired = true;
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        (entry.target as HTMLElement).dataset.revealed = '';
                        observer.unobserve(entry.target);
                    }
                }
            },
            { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
        );

        // Dead-observer failsafe: in any environment where IO exists but
        // never delivers callbacks (embedded webviews, some emulators), the
        // initial in-view elements would stay hidden. Healthy browsers fire
        // within one frame, so this never affects them.
        const failsafe = setTimeout(() => {
            if (observerFired) return;
            for (const el of document.querySelectorAll<HTMLElement>(
                'main [data-reveal], main [data-reveal-stagger]',
            )) {
                el.dataset.revealed = '';
            }
        }, 3000);

        const observeAll = () => {
            for (const el of document.querySelectorAll(
                'main [data-reveal]:not([data-revealed]), main [data-reveal-stagger]:not([data-revealed])',
            )) {
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
