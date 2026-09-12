'use client';

import {
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

/**
 * Scroll-snap carousel: the browser does the scrolling and snapping, so
 * touch, trackpad, and keyboard scrolling all work with no JS; the client
 * side only adds Previous/Next buttons and the "n of N" readout. Slides
 * are `group`s with a slide role description per the WAI-ARIA carousel
 * pattern, and nothing auto-advances — a rotating carousel fails 2.2.2
 * without a pause control and hides content from people who read slowly.
 *
 * One slide renders as a plain block (no buttons, no counter).
 */
export function Carousel({
    label,
    slides,
    slideClassName = 'w-full',
    className = '',
}: {
    label: string;
    slides: ReactNode[];
    /** Width utilities for each slide; snap alignment is fixed to start. */
    slideClassName?: string;
    className?: string;
}) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const count = slides.length;

    // Nearest slide to the track's left edge is the current one. The
    // track is `relative`, so each slide's offsetLeft is measured from the
    // track itself — not from <body>, which would fold the page's centring
    // gutter into every measurement. Layout reads are batched per frame.
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        let frame = 0;
        const measure = () => {
            frame = 0;
            const { scrollLeft } = track;
            const children = Array.from(track.children) as HTMLElement[];
            let nearest = 0;
            let nearestDistance = Infinity;
            children.forEach((child, i) => {
                const distance = Math.abs(child.offsetLeft - scrollLeft);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearest = i;
                }
            });
            setIndex(nearest);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(measure);
        };
        track.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            track.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    const goTo = useCallback((target: number) => {
        const track = trackRef.current;
        if (!track) return;
        const child = track.children[target] as HTMLElement | undefined;
        if (!child) return;
        const reduce = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        track.scrollTo({
            left: child.offsetLeft,
            behavior: reduce ? 'auto' : 'smooth',
        });
    }, []);

    if (count === 0) return null;
    if (count === 1) {
        return <div className={className}>{slides[0]}</div>;
    }

    const buttonClass =
        'flex h-11 w-11 items-center justify-center border-2 border-holiday-red font-alt-gothic text-[22px] font-black leading-none text-holiday-red transition-colors hover:bg-holiday-red hover:text-holiday-white disabled:cursor-default disabled:border-holiday-grey disabled:text-holiday-grey disabled:hover:bg-transparent';

    return (
        <div
            role='region'
            aria-roledescription='carousel'
            aria-label={label}
            className={className}
        >
            {/* Focusable so keyboard users can scroll the strip itself
                (axe: scrollable-region-focusable), not only the buttons. */}
            <div
                ref={trackRef}
                tabIndex={0}
                aria-label={`${label} — scroll to browse`}
                className='relative flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth outline-none focus-visible:ring-2 focus-visible:ring-holiday-red focus-visible:ring-offset-4 motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            >
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        role='group'
                        aria-roledescription='slide'
                        aria-label={`${i + 1} of ${count}`}
                        className={`shrink-0 snap-start ${slideClassName}`}
                    >
                        {slide}
                    </div>
                ))}
            </div>
            <div className='mt-6 flex items-center justify-center gap-4'>
                <button
                    type='button'
                    className={buttonClass}
                    onClick={() => goTo(index - 1)}
                    disabled={index === 0}
                    aria-label='Previous'
                >
                    <span aria-hidden>‹</span>
                </button>
                <span
                    aria-live='polite'
                    className='min-w-14 text-center font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.05em] text-onyx'
                >
                    {index + 1} / {count}
                </span>
                <button
                    type='button'
                    className={buttonClass}
                    onClick={() => goTo(index + 1)}
                    disabled={index === count - 1}
                    aria-label='Next'
                >
                    <span aria-hidden>›</span>
                </button>
            </div>
        </div>
    );
}
