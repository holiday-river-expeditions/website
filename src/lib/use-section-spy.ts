import { useEffect, useState } from 'react';

/**
 * Which page section the visitor is reading, for section menus
 * (SectionNav, TripBar).
 *
 * `active` is the last section whose top has passed a reading line 40%
 * down the viewport, so gaps between sections keep the one above. Nothing
 * is active above the first section or below the last. `started` turns on
 * once the first section reaches the upper half of the screen.
 *
 * Read from positions on every frame rather than from an
 * IntersectionObserver, which misses sections a jump skips over.
 */
export function useSectionSpy(ids: readonly string[]): {
    active: string | null;
    started: boolean;
} {
    const [active, setActive] = useState<string | null>(null);
    const [started, setStarted] = useState(false);
    const key = ids.join('|');

    useEffect(() => {
        const sections = key
            .split('|')
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);
        if (sections.length === 0) return;
        const first = sections[0];
        const last = sections[sections.length - 1];

        let frame = 0;
        const update = () => {
            frame = 0;
            const line = window.innerHeight * 0.4;
            const firstTop = first.getBoundingClientRect().top;
            setStarted(firstTop < window.innerHeight / 2);
            if (firstTop > line || last.getBoundingClientRect().bottom < line) {
                setActive(null);
                return;
            }
            const current = sections.findLast(
                (section) => section.getBoundingClientRect().top <= line,
            );
            setActive(current?.id ?? null);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [key]);

    return { active, started };
}
