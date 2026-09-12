'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';

/**
 * True once the referenced element has come within `rootMargin` of the
 * viewport; stays true after. Used to defer heavy client bundles (the
 * maps) until a visitor scrolls near them. Environments without
 * IntersectionObserver never flip, so the placeholder stays — the maps
 * are enhancement, not content.
 */
export function useInView<T extends HTMLElement>(
    rootMargin: string,
): { ref: RefObject<T | null>; inView: boolean } {
    const ref = useRef<T>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin },
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [rootMargin]);

    return { ref, inView };
}
