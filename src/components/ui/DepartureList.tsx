import Link from 'next/link';
import { BookingRow } from '@/components/ui/BookingRow';
import { buttonClasses } from '@/components/ui/Button';
import { ExternalLink } from '@/components/ui/ExternalLink';
import type { ArcticDeparture } from '@/lib/arctic';
import {
    type DepartureCallout,
    type DepartureCalloutMap,
    departureAnchor,
    durationToDays,
    formatDateRange,
    groupDeparturesByMonth,
} from '@/lib/departures';

/**
 * Native in-row booking is feature-flagged: off (or when a row's pricing
 * can't resolve) the Book action stays an external link into Arctic's
 * hosted reserve flow — that link is also the no-JS fallback.
 */
const nativeBookingEnabled = () => process.env.BOOKING_NATIVE === 'true';

/**
 * Renders Arctic departures as a schedule: month subheads (with years when
 * the list spans them) or one flat list, a seats warning when few are left,
 * and a book action per row. Long lists collapse behind a native <details>
 * so the schedule stays scannable without JavaScript.
 *
 * Server component; rows carry data-triptype so DepartureVariantChips
 * (a sibling client island) can filter visibility.
 */

/**
 * Seat counts show only at or below this. A badge on every row is noise
 * that hides the rows where it matters (NN/g: a signal shown everywhere
 * stops being read).
 */
export const LOW_SEATS_THRESHOLD = 6;

/** Rows shown before the rest collapses behind "Show all". */
const VISIBLE_ROWS = 8;

/**
 * Sand fill rather than red: within this list red already means "few seats
 * left", and a second red badge meaning "this date is special" would read as
 * urgency. Sand carries onyx text for AA contrast (same pairing as the biking
 * tag on TripCard).
 */
function CalloutBadge({ callout }: { callout: DepartureCallout }) {
    const className =
        'inline-block bg-sand px-3.5 py-1.5 text-[14px] font-bold leading-tight text-onyx';
    if (callout.href) {
        return (
            <Link
                href={callout.href}
                className={`${className} transition-opacity hover:opacity-70`}
            >
                {callout.label}
            </Link>
        );
    }
    return <span className={className}>{callout.label}</span>;
}

export function SeatsBadge({ seats }: { seats: number | null }) {
    if (seats === null) return null;
    if (seats <= 0) {
        return (
            <span className='inline-block bg-holiday-grey/30 px-3.5 py-1.5 text-[14px] font-bold leading-tight text-onyx'>
                Full
            </span>
        );
    }
    if (seats > LOW_SEATS_THRESHOLD) return null;
    return (
        <span className='inline-block bg-holiday-red px-3.5 py-1.5 text-[14px] font-bold leading-tight text-holiday-white'>
            {seats} {seats === 1 ? 'seat' : 'seats'} left
        </span>
    );
}

/** Short outlined tag for a trip length ("4-Day"), shared with /book's
    card header so row and header read as one set. */
export function VariantTag({ label }: { label: string }) {
    return (
        <span className='inline-block border border-onyx/30 px-2 py-0.5 font-alt-gothic text-[14px] font-semibold uppercase leading-tight tracking-[0.04em] text-onyx'>
            {label}
        </span>
    );
}

function DepartureRow({
    departure,
    showTripName,
    variantLabel,
    callout,
    hiddenBelowLg = false,
    anchored = false,
}: {
    departure: ArcticDeparture;
    showTripName: boolean;
    variantLabel?: string;
    callout?: DepartureCallout;
    hiddenBelowLg?: boolean;
    /** Carries the date's anchor id (first row on a specialty date). */
    anchored?: boolean;
}) {
    const seats = departure.remainingopenings ?? null;
    const bookable = seats !== null && seats > 0 && departure.onlinebookingurl;
    const days = durationToDays(departure.duration);

    // key: this element crosses the RSC boundary as BookingRow's dateSlot
    // prop; serialization drops the static-children flag, so React treats
    // the client fragment's children as a dynamic list and wants keys.
    const dateCell = (
        <div key='date-cell'>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                <span className='font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-onyx'>
                    {formatDateRange(departure.start, departure.duration)}
                </span>
                {variantLabel ? (
                    <VariantTag label={variantLabel} />
                ) : (
                    days &&
                    days > 1 && (
                        <span className='text-[13px] text-onyx/70'>
                            {days} days
                        </span>
                    )
                )}
            </div>
            {showTripName && !variantLabel && departure.name && (
                <div className='mt-0.5 text-body leading-body text-onyx/80'>
                    {departure.name}
                </div>
            )}
            {callout && (
                <div className='mt-2'>
                    <CalloutBadge callout={callout} />
                    {callout.note && (
                        <p className='mt-1.5 max-w-prose text-body leading-body text-onyx/80'>
                            {callout.note}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <li
            id={anchored ? departureAnchor(departure.start) : undefined}
            data-triptype={departure.triptypeid ?? undefined}
            // DepartureHashTarget sets data-highlighted on the row a
            // specialty link lands on. The shadow extends the tint past the
            // row edges so the text doesn't sit flush against it.
            className={`grid scroll-mt-28 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4 sm:gap-x-6 data-[highlighted=true]:bg-sand/30 data-[highlighted=true]:shadow-[0_0_0_12px_color-mix(in_srgb,var(--color-sand)_30%,transparent)] ${hiddenBelowLg ? 'max-lg:hidden' : ''}`}
        >
            {bookable && nativeBookingEnabled() && departure.triptypeid ? (
                // BookingRow owns the row internals so its expanded panel can
                // span both grid columns; the server-rendered cells pass
                // through as slots.
                <BookingRow
                    departureId={departure.id}
                    triptypeid={departure.triptypeid}
                    seatsRemaining={seats}
                    fallbackUrl={departure.onlinebookingurl ?? '#'}
                    dateLabel={formatDateRange(
                        departure.start,
                        departure.duration,
                    )}
                    dateSlot={dateCell}
                    badgeSlot={<SeatsBadge key='badge' seats={seats} />}
                />
            ) : (
                <>
                    {dateCell}
                    <div className='flex flex-wrap items-center justify-end gap-x-4 gap-y-2 justify-self-end'>
                        <SeatsBadge seats={seats} />
                        {bookable ? (
                            <ExternalLink
                                href={departure.onlinebookingurl ?? '#'}
                                // ExternalLink supplies its own inline-flex.
                                className={buttonClasses({
                                    variant: 'primary',
                                    display: '',
                                    className: 'text-center',
                                })}
                            >
                                Book
                            </ExternalLink>
                        ) : (
                            <a
                                href='tel:+18012662087'
                                className={buttonClasses({
                                    variant: 'outline',
                                    className: 'text-center',
                                })}
                            >
                                Call to Book
                            </a>
                        )}
                    </div>
                </>
            )}
        </li>
    );
}

interface MonthGroupData {
    monthLabel: string;
    year: number;
    showYear: boolean;
    departures: ArcticDeparture[];
}

function monthGroupLabel(group: MonthGroupData): string {
    return group.showYear && group.year > 0
        ? `${group.monthLabel} ${group.year}`
        : group.monthLabel;
}

interface RowOptions {
    showTripName: boolean;
    variantLabels?: ReadonlyMap<number, string>;
    callouts?: DepartureCalloutMap;
    /** Departure ids whose row carries its date's anchor id. */
    anchoredIds?: ReadonlySet<number>;
}

function DepartureRows({
    departures,
    showTripName,
    variantLabels,
    callouts,
    anchoredIds,
    hideBelowLgFrom = Infinity,
}: RowOptions & {
    departures: ArcticDeparture[];
    /** Index from which rows are hidden below lg. */
    hideBelowLgFrom?: number;
}) {
    return (
        <ul className='divide-y divide-holiday-grey/40 border-y border-holiday-grey/40'>
            {departures.map((departure, index) => (
                <DepartureRow
                    key={departure.id}
                    hiddenBelowLg={index >= hideBelowLgFrom}
                    departure={departure}
                    showTripName={showTripName}
                    variantLabel={
                        departure.triptypeid
                            ? variantLabels?.get(departure.triptypeid)
                            : undefined
                    }
                    callout={callouts?.get(departure.start)}
                    anchored={anchoredIds?.has(departure.id) ?? false}
                />
            ))}
        </ul>
    );
}

function MonthGroup({
    group,
    ...rowOptions
}: RowOptions & { group: MonthGroupData }) {
    return (
        <div>
            <h3 className='pb-1 pt-2 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.1em] text-teal'>
                {monthGroupLabel(group)}
            </h3>
            <DepartureRows departures={group.departures} {...rowOptions} />
        </div>
    );
}

function ShowAllSummary({ count }: { count: number }) {
    return (
        <summary
            className={buttonClasses({
                variant: 'outline',
                display: 'inline-flex',
                className:
                    'cursor-pointer list-none items-center gap-2 group-open:hidden [&::-webkit-details-marker]:hidden',
            })}
        >
            Show all {count} dates
            <span aria-hidden>↓</span>
        </summary>
    );
}

interface DepartureListProps {
    departures: ArcticDeparture[];
    /** Show the Arctic trip name per row (for pages mixing variants).
        Ignored on rows that have a variant label. */
    showTripName?: boolean;
    /** Short length label per trip type, shown as a tag on each row in
        place of the trip name. */
    variantLabels?: ReadonlyMap<number, string>;
    /** Specialty callouts keyed by departure start date (YYYY-MM-DD). */
    callouts?: DepartureCalloutMap;
    /** Month subheads, on by default. Off renders one flat list, for
        lists where the date range already names the month. */
    groupByMonth?: boolean;
    /** Month-grouped lists: rows shown before the rest collapses behind
        "Show all". */
    visibleRows?: number;
    /** Flat lists: below lg, rows past this many hide and a "Show all"
        link to showAllHref takes their place. From lg up every row shows
        (the caller bounds the height and scrolls it). */
    compactRows?: number;
    showAllHref?: string;
}

export function DepartureList({
    departures,
    showTripName = false,
    variantLabels,
    callouts,
    groupByMonth = true,
    visibleRows = VISIBLE_ROWS,
    compactRows = Infinity,
    showAllHref,
}: DepartureListProps) {
    // Only the first row on each specialty date gets the anchor id: two
    // variants can start the same day, and ids must be unique.
    const anchoredIds = new Set<number>();
    const anchoredDates = new Set<string>();
    for (const departure of departures) {
        if (!callouts?.has(departure.start)) continue;
        if (anchoredDates.has(departure.start)) continue;
        anchoredDates.add(departure.start);
        anchoredIds.add(departure.id);
    }
    const rowOptions: RowOptions = {
        showTripName,
        variantLabels,
        callouts,
        anchoredIds,
    };

    if (!groupByMonth) {
        // One list in the DOM at every width. Hiding rows with CSS rather
        // than <details> lets lg show them all in a scroll area while
        // phones get the short preview. A scroll box per card would catch
        // the page's swipes on a phone.
        const compact = showAllHref && departures.length > compactRows;
        return (
            <div data-departure-list className='space-y-4'>
                <DepartureRows
                    departures={departures}
                    hideBelowLgFrom={compact ? compactRows : Infinity}
                    {...rowOptions}
                />
                {compact && (
                    <Link
                        href={showAllHref}
                        className={buttonClasses({
                            variant: 'outline',
                            display: 'inline-flex',
                            className: 'items-center gap-2 lg:hidden',
                        })}
                    >
                        Show all {departures.length} dates
                        <span aria-hidden>→</span>
                    </Link>
                )}
            </div>
        );
    }

    const groups = groupDeparturesByMonth(departures);

    // Split whole month-groups so roughly visibleRows rows show before the
    // native <details> collapse — months never get sliced mid-group.
    let visibleCount = 0;
    const visibleGroups: MonthGroupData[] = [];
    const collapsedGroups: MonthGroupData[] = [];
    for (const group of groups) {
        if (visibleCount < visibleRows) {
            visibleGroups.push(group);
            visibleCount += group.departures.length;
        } else {
            collapsedGroups.push(group);
        }
    }

    return (
        <div data-departure-list className='space-y-8'>
            {visibleGroups.map((group) => (
                <MonthGroup
                    key={`${group.year}-${group.monthLabel}`}
                    group={group}
                    {...rowOptions}
                />
            ))}
            {collapsedGroups.length > 0 && (
                // The browser opens this itself when the URL names a row
                // inside it (a specialty date link), before hydration.
                <details
                    data-departure-overflow
                    className='group'
                    suppressHydrationWarning
                >
                    <ShowAllSummary count={departures.length} />
                    <div className='space-y-8'>
                        {collapsedGroups.map((group) => (
                            <MonthGroup
                                key={`${group.year}-${group.monthLabel}`}
                                group={group}
                                {...rowOptions}
                            />
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}
