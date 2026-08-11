import { ExternalLink } from '@/components/ui/ExternalLink';
import type { ArcticDeparture } from '@/lib/arctic';

/**
 * Renders Arctic departures as a schedule table: date range, trip variant,
 * seats remaining with urgency states, and a book action per row.
 * Server-rendered; data comes from the Arctic read API at ISR time.
 */

const LOW_SEATS_THRESHOLD = 4;

const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
});

function formatDateRange(start: string, durationHours: number | null): string {
    const startDate = new Date(`${start}T00:00:00Z`);
    if (Number.isNaN(startDate.getTime())) return start;
    const days = durationHours
        ? Math.max(1, Math.round(durationHours / 24))
        : null;
    if (!days || days === 1) return dateFormat.format(startDate);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + days - 1);
    return `${dateFormat.format(startDate)} – ${dateFormat.format(endDate)}`;
}

/** Arctic serializes duration as "HH:MM:SS" (e.g. "120:00:00" = 5 days). */
function durationToHours(duration: string | null | undefined): number | null {
    if (!duration) return null;
    const hours = Number(duration.split(':')[0]);
    return Number.isFinite(hours) && hours > 0 ? hours : null;
}

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

interface DepartureListProps {
    departures: ArcticDeparture[];
    /** Show the Arctic trip name per row (for pages mixing variants). */
    showTripName?: boolean;
}

export function DepartureList({
    departures,
    showTripName = false,
}: DepartureListProps) {
    return (
        <ul className='divide-y divide-holiday-grey/40 border-y border-holiday-grey/40'>
            {departures.map((departure) => {
                const seats = departure.remainingopenings ?? null;
                const bookable =
                    seats !== null && seats > 0 && departure.onlinebookingurl;
                const days = durationToHours(departure.duration);
                return (
                    <li
                        key={departure.id}
                        className='flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4'
                    >
                        <div className='min-w-[180px]'>
                            <span className='font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-onyx'>
                                {formatDateRange(departure.start, days)}
                            </span>
                            {days && days >= 24 && (
                                <span className='ml-3 text-[13px] uppercase tracking-wider text-onyx/70'>
                                    {Math.round(days / 24)} days
                                </span>
                            )}
                        </div>
                        {showTripName && departure.name && (
                            <span className='grow text-body leading-body text-onyx'>
                                {departure.name}
                            </span>
                        )}
                        <div className='flex items-center gap-4'>
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
                    </li>
                );
            })}
        </ul>
    );
}
