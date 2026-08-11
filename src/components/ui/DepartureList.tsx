import { BookingRow } from '@/components/ui/BookingRow';
import { ExternalLink } from '@/components/ui/ExternalLink';
import type { ArcticDeparture } from '@/lib/arctic';
import {
    durationToDays,
    formatDateRange,
    groupDeparturesByMonth,
} from '@/lib/departures';

/**
 * Native in-row booking is feature-flagged: off (or when a row's pricing
 * can't resolve) the Book action stays an external link into Arctic's
 * hosted reserve flow — that link is also the no-JS fallback.
 */
const NATIVE_BOOKING = process.env.BOOKING_NATIVE === 'true';

/**
 * Renders Arctic departures as a month-grouped schedule: month subheads
 * (with years when the list spans them), seats remaining with urgency
 * states, and a book action per row. Long lists collapse behind a native
 * <details> so the schedule stays scannable without JavaScript.
 *
 * Server component; rows carry data-triptype so DepartureVariantChips
 * (a sibling client island) can filter visibility.
 */

const LOW_SEATS_THRESHOLD = 4;

/** Rows shown before the rest collapses behind "Show all". */
const VISIBLE_ROWS = 8;

function SeatsBadge({ seats }: { seats: number | null }) {
    if (seats === null) return null;
    if (seats <= 0) {
        return (
            <span className='inline-block bg-holiday-grey/30 px-3 py-1 font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-onyx'>
                Full
            </span>
        );
    }
    const urgent = seats <= LOW_SEATS_THRESHOLD;
    return (
        <span
            className={`inline-block px-3 py-1 font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-holiday-white ${urgent ? 'bg-holiday-red' : 'bg-evergreen'}`}
        >
            {seats} {seats === 1 ? 'seat' : 'seats'} left
        </span>
    );
}

function DepartureRow({
    departure,
    showTripName,
}: {
    departure: ArcticDeparture;
    showTripName: boolean;
}) {
    const seats = departure.remainingopenings ?? null;
    const bookable = seats !== null && seats > 0 && departure.onlinebookingurl;
    const days = durationToDays(departure.duration);

    const dateCell = (
        <div>
            <div>
                <span className='font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-onyx'>
                    {formatDateRange(departure.start, departure.duration)}
                </span>
                {days && days > 1 && (
                    <span className='ml-3 text-[13px] uppercase tracking-wider text-onyx/70'>
                        {days} days
                    </span>
                )}
            </div>
            {showTripName && departure.name && (
                <div className='mt-0.5 text-body leading-body text-onyx/80'>
                    {departure.name}
                </div>
            )}
        </div>
    );

    return (
        <li
            data-triptype={departure.triptypeid ?? undefined}
            className='grid grid-cols-1 items-center gap-x-6 gap-y-2 py-4 sm:grid-cols-[minmax(200px,1fr)_auto]'
        >
            {bookable && NATIVE_BOOKING && departure.triptypeid ? (
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
                    badgeSlot={<SeatsBadge seats={seats} />}
                />
            ) : (
                <>
                    {dateCell}
                    <div className='flex flex-wrap items-center gap-4 justify-self-start sm:justify-self-end'>
                        <SeatsBadge seats={seats} />
                        {bookable ? (
                            <ExternalLink
                                href={departure.onlinebookingurl ?? '#'}
                                className='bg-holiday-red px-6 py-2 text-center font-alt-gothic text-[19px] font-medium uppercase leading-none tracking-wide text-holiday-white transition-colors hover:bg-holiday-red/90'
                            >
                                Book
                            </ExternalLink>
                        ) : (
                            <a
                                href='tel:+18012662087'
                                className='inline-block border-2 border-holiday-red px-6 py-2 text-center font-alt-gothic text-[19px] font-medium uppercase leading-none tracking-wide text-holiday-red transition-colors hover:bg-holiday-red hover:text-holiday-white'
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

function MonthGroup({
    group,
    showTripName,
}: {
    group: MonthGroupData;
    showTripName: boolean;
}) {
    return (
        <div>
            <h3 className='pb-1 pt-2 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.1em] text-teal'>
                {monthGroupLabel(group)}
            </h3>
            <ul className='divide-y divide-holiday-grey/40 border-y border-holiday-grey/40'>
                {group.departures.map((departure) => (
                    <DepartureRow
                        key={departure.id}
                        departure={departure}
                        showTripName={showTripName}
                    />
                ))}
            </ul>
        </div>
    );
}

interface DepartureListProps {
    departures: ArcticDeparture[];
    /** Show the Arctic trip name per row (for pages mixing variants). */
    showTripName?: boolean;
}

export function DepartureList({
    departures,
    showTripName = false,
}: DepartureListProps) {
    const groups = groupDeparturesByMonth(departures);

    // Split whole month-groups so roughly VISIBLE_ROWS rows show before the
    // native <details> collapse — months never get sliced mid-group.
    let visibleCount = 0;
    const visibleGroups: MonthGroupData[] = [];
    const collapsedGroups: MonthGroupData[] = [];
    for (const group of groups) {
        if (visibleCount < VISIBLE_ROWS) {
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
                    showTripName={showTripName}
                />
            ))}
            {collapsedGroups.length > 0 && (
                <details data-departure-overflow className='group'>
                    <summary className='inline-flex cursor-pointer list-none items-center gap-2 border-2 border-holiday-red px-6 py-2 font-alt-gothic text-[19px] font-medium uppercase leading-none tracking-wide text-holiday-red transition-colors hover:bg-holiday-red hover:text-holiday-white group-open:hidden [&::-webkit-details-marker]:hidden'>
                        Show all {departures.length} departures
                        <span aria-hidden>↓</span>
                    </summary>
                    <div className='space-y-8'>
                        {collapsedGroups.map((group) => (
                            <MonthGroup
                                key={`${group.year}-${group.monthLabel}`}
                                group={group}
                                showTripName={showTripName}
                            />
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}
