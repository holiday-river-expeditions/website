'use client';

import Link from 'next/link';
import type { MonthOption } from '@/lib/departures';

/**
 * Floating filter bar for Open Seats. Replaces the 15-stop section index,
 * which failed basic usability heuristics (no chunking, duplicate labels,
 * options hidden behind horizontal scroll).
 *
 * - Month chips are real links (?month=YYYY-MM), so the filter state is
 *   visible, one click to clear, shareable, and works without JS. The
 *   server filters the list — no flash, no client DOM surgery.
 * - The trip jumper is a native <select>: the right control for a long
 *   list of destinations, with per-option next-date text disambiguating
 *   trips that share a display name.
 */

export interface FilterBarMonth extends MonthOption {
    /** Departures in this month, shown for information scent. */
    count: number;
}

export interface FilterBarTrip {
    /** DOM id of the trip group's section. */
    id: string;
    label: string;
}

export function DepartureFilterBar({
    months,
    activeMonth,
    trips,
}: {
    months: FilterBarMonth[];
    activeMonth: string | null;
    trips: FilterBarTrip[];
}) {
    return (
        <nav
            aria-label='Filter departures'
            className='fixed bottom-4 left-1/2 z-40 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2'
        >
            <div className='flex items-center gap-3 border border-holiday-grey/40 bg-holiday-white p-1.5 pl-3 shadow-lg'>
                <ul className='flex gap-1 overflow-x-auto'>
                    <li className='shrink-0'>
                        <Link
                            href='/book'
                            aria-current={
                                activeMonth === null ? 'true' : undefined
                            }
                            className={`block whitespace-nowrap px-3 py-2 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em] ${
                                activeMonth === null
                                    ? 'bg-holiday-red text-holiday-white'
                                    : 'text-onyx hover:text-holiday-red'
                            }`}
                        >
                            All dates
                        </Link>
                    </li>
                    {months.map((month) => (
                        <li key={month.value} className='shrink-0'>
                            <Link
                                href={`/book?month=${month.value}`}
                                aria-current={
                                    activeMonth === month.value
                                        ? 'true'
                                        : undefined
                                }
                                className={`block whitespace-nowrap px-3 py-2 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em] ${
                                    activeMonth === month.value
                                        ? 'bg-holiday-red text-holiday-white'
                                        : 'text-onyx hover:text-holiday-red'
                                }`}
                            >
                                {month.label}
                                {/* /75 not /60: 12px text needs 4.5:1 on
                                    white and onyx/60 lands at 3.9 (axe). */}
                                <span
                                    className={`ml-1 text-[12px] font-normal ${
                                        activeMonth === month.value
                                            ? 'text-holiday-white'
                                            : 'text-onyx/75'
                                    }`}
                                >
                                    {month.count}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
                {trips.length > 1 && (
                    <>
                        <span
                            aria-hidden
                            className='h-6 w-px shrink-0 bg-holiday-grey/40'
                        />
                        <label className='shrink-0'>
                            <span className='sr-only'>Jump to trip</span>
                            <select
                                value=''
                                onChange={(event) => {
                                    const id = event.target.value;
                                    if (!id) return;
                                    document
                                        .getElementById(id)
                                        ?.scrollIntoView();
                                    window.history.replaceState(
                                        null,
                                        '',
                                        `#${id}`,
                                    );
                                }}
                                className='max-w-44 border border-holiday-grey/40 bg-holiday-white px-2 py-2 font-alt-gothic text-[14px] font-semibold uppercase tracking-[0.04em] text-onyx'
                            >
                                <option value=''>Jump to trip…</option>
                                {trips.map((trip) => (
                                    <option key={trip.id} value={trip.id}>
                                        {trip.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </>
                )}
            </div>
        </nav>
    );
}
