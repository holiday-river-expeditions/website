'use client';

import { useEffect, useState } from 'react';
import { useDemoFlag } from '@/lib/use-demo-flag';

export interface SectionNavItem {
    /** id of the target section element (rendered as href="#id"). */
    id: string;
    label: string;
}

/**
 * Floating section menu for content-heavy pages (Aug 20 decision: trip
 * pages get a scroll-following menu; specialty families get jump links).
 * A fixed pill bar centered at the bottom of the viewport, one plain
 * anchor per section, with the section currently in view highlighted.
 *
 * Plain anchors keep it working without JS; the client side only adds
 * show-on-scroll and the active highlight. Smooth scrolling comes from
 * `motion-safe:scroll-smooth` on <html>, so reduced-motion users get
 * instant jumps. z-40 keeps it under the demo-flags overlay (z-[100]).
 */
export function SectionNav({
    items,
    ariaLabel = 'Page sections',
    showAfter = 320,
}: {
    items: SectionNavItem[];
    ariaLabel?: string;
    /** Scroll offset (px) before the bar appears; 0 = always visible. */
    showAfter?: number;
}) {
    // Demo flag: Holiday can compare always-visible bars against
    // show-on-scroll without a deploy.
    const barsOnScroll = useDemoFlag('bars-on-scroll');
    const threshold = barsOnScroll ? Math.max(showAfter, 320) : showAfter;
    const [scrolled, setScrolled] = useState(false);
    const [active, setActive] = useState<string | null>(null);
    const visible = threshold === 0 || scrolled;

    useEffect(() => {
        if (threshold === 0) return;
        const onScroll = () => setScrolled(window.scrollY > threshold);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);

    useEffect(() => {
        const sections = items
            .map((item) => document.getElementById(item.id))
            .filter((el): el is HTMLElement => el !== null);
        if (sections.length === 0) return;

        // A section is "active" while it crosses the band around the upper
        // middle of the viewport.
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActive(entry.target.id);
                    }
                }
            },
            { rootMargin: '-35% 0px -55% 0px' },
        );
        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, [items]);

    if (items.length === 0) return null;

    return (
        <nav
            aria-label={ariaLabel}
            className={`fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transition-opacity duration-200 ${
                visible
                    ? 'opacity-100'
                    : 'pointer-events-none invisible opacity-0'
            }`}
        >
            <ul className='flex max-w-[calc(100vw-2rem)] gap-1 overflow-x-auto border border-holiday-grey/40 bg-holiday-white p-1 shadow-lg'>
                {items.map((item) => (
                    <li key={item.id} className='shrink-0'>
                        <a
                            href={`#${item.id}`}
                            aria-current={
                                active === item.id ? 'true' : undefined
                            }
                            // No transition-colors here: axe samples the page
                            // right as the observer sets the first active item,
                            // and a mid-fade red fails contrast.
                            className={`block whitespace-nowrap px-3.5 py-2 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em] ${
                                active === item.id
                                    ? 'bg-holiday-red text-holiday-white'
                                    : 'text-onyx hover:text-holiday-red'
                            }`}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
