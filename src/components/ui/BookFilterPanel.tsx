import Link from 'next/link';
import { BookTripSelect } from '@/components/ui/BookTripSelect';
import {
    type BookFilterOption,
    type BookFilters,
    bookHref,
} from '@/lib/book-filters';

/**
 * /book filters: month, trip length and trip. Every option is a link to a
 * filtered URL, so the server renders the result, the state is shareable,
 * and nothing depends on JavaScript.
 *
 * Each option shows how many dates it would leave (with the other filters
 * applied), and options that would leave none are shown but not linked, so
 * a visitor never filters into an empty page (NN/g on faceted search).
 *
 * The page renders this twice: in a sticky sidebar on desktop and inside a
 * "Filters" disclosure on smaller screens.
 */

const HEADING =
    'block font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.1em] text-teal';

const CHIP =
    'inline-flex items-baseline gap-1.5 border px-3 py-1.5 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em]';

function Chip({
    label,
    count,
    href,
    active,
}: {
    label: string;
    count?: number;
    href: string;
    active: boolean;
}) {
    const countLabel = count !== undefined && (
        // /75 not /60: 12px text needs 4.5:1 on white (axe).
        <span
            className={`text-[12px] font-normal ${active ? 'text-holiday-white' : 'text-onyx/75'}`}
        >
            {count}
        </span>
    );
    if (!active && count === 0) {
        return (
            <span
                aria-disabled
                className={`${CHIP} cursor-default border-onyx/10 text-onyx/45`}
            >
                {label}
                <span className='text-[12px] font-normal'>0</span>
            </span>
        );
    }
    return (
        <Link
            href={href}
            aria-current={active ? 'true' : undefined}
            className={`${CHIP} ${
                active
                    ? 'border-holiday-red bg-holiday-red text-holiday-white'
                    : 'border-onyx/25 text-onyx transition-colors hover:border-holiday-red hover:text-holiday-red'
            }`}
        >
            {label}
            {countLabel}
        </Link>
    );
}

function ChipGroup({
    heading,
    allLabel,
    options,
    active,
    hrefFor,
}: {
    heading: string;
    allLabel: string;
    options: BookFilterOption[];
    active: string | null;
    hrefFor: (value: string | null) => string;
}) {
    return (
        <div role='group' aria-label={heading}>
            <h3 className={HEADING}>{heading}</h3>
            <ul className='mt-2 flex flex-wrap gap-2'>
                <li>
                    <Chip
                        label={allLabel}
                        href={hrefFor(null)}
                        active={active === null}
                    />
                </li>
                {options.map((option) => (
                    <li key={option.value}>
                        <Chip
                            label={option.label}
                            count={option.count}
                            href={hrefFor(option.value)}
                            active={active === option.value}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function BookFilterPanel({
    filters,
    months,
    lengths,
    trips,
}: {
    filters: BookFilters;
    months: BookFilterOption[];
    lengths: BookFilterOption[];
    trips: BookFilterOption[];
}) {
    return (
        <div className='space-y-7'>
            <ChipGroup
                heading='Month'
                allLabel='Any month'
                options={months}
                active={filters.month}
                hrefFor={(month) => bookHref({ ...filters, month })}
            />
            {lengths.length > 1 && (
                <ChipGroup
                    heading='Trip length'
                    allLabel='Any length'
                    options={lengths}
                    active={filters.days}
                    hrefFor={(days) =>
                        bookHref({
                            ...filters,
                            days: days as BookFilters['days'],
                        })
                    }
                />
            )}
            {trips.length > 1 && (
                <BookTripSelect
                    filters={filters}
                    trips={trips}
                    labelClassName={HEADING}
                />
            )}
        </div>
    );
}
