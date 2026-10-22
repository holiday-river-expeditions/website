'use client';

import { useRouter } from 'next/navigation';
import { useId } from 'react';
import {
    type BookFilterOption,
    type BookFilters,
    bookHref,
} from '@/lib/book-filters';

/**
 * Trip filter on /book. A native <select> suits a list of a dozen or more
 * trips, where chips would wrap into a wall. It is a plain GET form, so it
 * works without JavaScript via the <noscript> button. With JavaScript,
 * picking a trip navigates straight away.
 */
export function BookTripSelect({
    filters,
    trips,
    labelClassName,
}: {
    filters: BookFilters;
    trips: BookFilterOption[];
    labelClassName: string;
}) {
    const router = useRouter();
    // A separate label, not a wrapping one: a wrapping label folds the
    // selected option into the select's accessible name.
    const selectId = useId();

    return (
        <form action='/book' method='get'>
            {filters.month && (
                <input type='hidden' name='month' value={filters.month} />
            )}
            {filters.days && (
                <input type='hidden' name='days' value={filters.days} />
            )}
            <label htmlFor={selectId} className={labelClassName}>
                Trip
            </label>
            <select
                id={selectId}
                // Keyed on the filter state so the shown value resets
                // when another filter navigates.
                key={bookHref(filters)}
                name='trip'
                defaultValue={filters.trip ?? ''}
                onChange={(event) =>
                    router.push(
                        bookHref({
                            ...filters,
                            trip: event.target.value || null,
                        }),
                    )
                }
                className='mt-2 w-full border border-onyx/25 bg-holiday-white px-3 py-2.5 text-body text-onyx'
            >
                <option value=''>All trips</option>
                {trips.map((trip) => (
                    <option
                        key={trip.value}
                        value={trip.value}
                        disabled={
                            trip.count === 0 && trip.value !== filters.trip
                        }
                    >
                        {trip.label} ({trip.count})
                    </option>
                ))}
            </select>
            <noscript>
                <button
                    type='submit'
                    className='mt-2 border border-onyx/25 px-3 py-2 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em] text-onyx'
                >
                    Show trip
                </button>
            </noscript>
        </form>
    );
}
