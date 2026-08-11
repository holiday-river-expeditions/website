'use client';

import { useRef, useState } from 'react';
import type { DepartureVariant } from '@/lib/departures';

/**
 * Variant filter chips (e.g. 5-Day / 6-Day) for a server-rendered
 * DepartureList. Progressive enhancement: the server renders every row
 * labeled; this island only toggles row visibility. Without JS the full
 * labeled list simply shows — nothing breaks.
 *
 * Scoped to the nearest [data-availability] ancestor so multiple lists on
 * one page (Open Seats) never interfere.
 */
export function DepartureVariantChips({
    variants,
}: {
    variants: DepartureVariant[];
}) {
    const [selected, setSelected] = useState<number | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    function apply(triptypeid: number | null) {
        setSelected(triptypeid);
        const scope = rootRef.current?.closest('[data-availability]');
        if (!scope) return;
        // Filtering hides the collapse affordance's meaning — open it so
        // "show only 5-Day" never silently hides matching rows.
        if (triptypeid !== null) {
            for (const details of scope.querySelectorAll(
                'details[data-departure-overflow]',
            )) {
                (details as HTMLDetailsElement).open = true;
            }
        }
        for (const row of scope.querySelectorAll<HTMLElement>(
            'li[data-triptype]',
        )) {
            row.hidden =
                triptypeid !== null &&
                row.dataset.triptype !== String(triptypeid);
        }
    }

    if (variants.length < 2) return null;

    const chipBase =
        'border-2 px-4 py-1.5 font-alt-gothic text-[15px] font-medium uppercase tracking-[0.05em] leading-none transition-colors';

    return (
        <div
            ref={rootRef}
            role='group'
            aria-label='Filter departures by trip length'
            className='flex flex-wrap gap-2'
        >
            <button
                type='button'
                aria-pressed={selected === null}
                onClick={() => apply(null)}
                className={`${chipBase} ${selected === null ? 'border-onyx bg-onyx text-holiday-white' : 'border-onyx/40 text-onyx hover:border-onyx'}`}
            >
                All Dates
            </button>
            {variants.map((variant) => (
                <button
                    key={variant.triptypeid}
                    type='button'
                    aria-pressed={selected === variant.triptypeid}
                    onClick={() => apply(variant.triptypeid)}
                    className={`${chipBase} ${selected === variant.triptypeid ? 'border-onyx bg-onyx text-holiday-white' : 'border-onyx/40 text-onyx hover:border-onyx'}`}
                >
                    {variant.label}
                </button>
            ))}
        </div>
    );
}
