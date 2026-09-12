'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hoverable-card state for map markers (WCAG 1.4.13): the card opens on
 * hover or focus, survives the pointer travelling from marker to card
 * (closing is delayed and cancelled when the pointer or focus lands on
 * the card), and Escape dismisses it without moving the pointer.
 *
 * Shared by the homepage trips map and the trip-page map so the grace
 * period and the dismiss contract can only ever change in one place.
 */
export function useHoverCard<T>(options: { onEscape?: () => void } = {}) {
    const { onEscape } = options;
    const [active, setActive] = useState<T | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelClose = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
    }, []);
    const show = useCallback(
        (item: T) => {
            cancelClose();
            setActive(item);
        },
        [cancelClose],
    );
    const scheduleHide = useCallback(() => {
        cancelClose();
        closeTimer.current = setTimeout(() => setActive(null), 200);
    }, [cancelClose]);
    const toggle = useCallback(
        (item: T, isSame: (current: T) => boolean) => {
            cancelClose();
            setActive((current) =>
                current !== null && isSame(current) ? null : item,
            );
        },
        [cancelClose],
    );

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActive(null);
                onEscape?.();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            cancelClose();
        };
    }, [cancelClose, onEscape]);

    return { active, show, scheduleHide, holdOpen: cancelClose, toggle };
}
