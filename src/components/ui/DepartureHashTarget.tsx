'use client';

import { useEffect } from 'react';

const PREFIX = 'departure-';

/**
 * Lands specialty links on their date in Dates & Availability. The trip
 * page callout and /specialty link to `#departure-YYYY-MM-DD`; this opens
 * the "Show all" <details> when the row is collapsed inside it, marks the
 * row, and scrolls to it. Done here rather than with :target because
 * client-side navigation from /specialty doesn't update :target.
 *
 * When the date has no row (an editor typo, or Arctic doesn't list it)
 * the link falls back to the top of the section.
 */
export function DepartureHashTarget({ fallbackId }: { fallbackId: string }) {
    useEffect(() => {
        let current: HTMLElement | null = null;

        function reveal() {
            current?.removeAttribute('data-highlighted');
            current = null;
            const id = decodeURIComponent(window.location.hash.slice(1));
            if (!id.startsWith(PREFIX)) return;
            const row = document.getElementById(id);
            if (!row) {
                document.getElementById(fallbackId)?.scrollIntoView();
                return;
            }
            const details = row.closest('details');
            if (details && !details.open) details.open = true;
            row.setAttribute('data-highlighted', 'true');
            current = row;
            row.scrollIntoView({ block: 'center' });
        }

        reveal();
        window.addEventListener('hashchange', reveal);
        return () => window.removeEventListener('hashchange', reveal);
    }, [fallbackId]);

    return null;
}
