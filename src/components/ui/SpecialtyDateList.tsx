import Image from 'next/image';
import Link from 'next/link';
import { BookingRow } from '@/components/ui/BookingRow';
import { buttonClasses } from '@/components/ui/Button';
import {
    nativeBookingEnabled,
    SeatsBadge,
} from '@/components/ui/DepartureList';
import { ExternalLink } from '@/components/ui/ExternalLink';
import {
    durationToDays,
    formatDateRange,
    type SpecialtyDateRow,
} from '@/lib/departures';
import { imageUrl } from '@/lib/sanity';

/**
 * The dated departures in one specialty family on /specialty: a photo, the
 * band or theme, the river trip it runs on, live seats and fare. The name
 * and photo link to the date's own page, and Book works in the row, one
 * click as on a trip page's dates list: it opens Arctic for that
 * departure, or the party-size panel when native booking is on. Specialty
 * trips are dates on regular river trips, so a plain trip card here would
 * hide the part people came for.
 */
export function SpecialtyDateList({
    rows,
    fares,
}: {
    rows: readonly SpecialtyDateRow[];
    /** Arctic full fare by trip-type id, for rows with a matched departure. */
    fares: ReadonlyMap<number, string>;
}) {
    return (
        <ul className='divide-y divide-holiday-grey/40 border-y border-holiday-grey/40'>
            {rows.map((row) => {
                const { departure } = row;
                const days = durationToDays(departure?.duration);
                // A price or length typed for the date wins, as on the
                // date's page (see specialtyDateFacts). Then Arctic's fare
                // for the matched departure, then the trip's own price.
                const fare =
                    (departure?.triptypeid != null &&
                        fares.get(departure.triptypeid)) ||
                    null;
                const ownPrice = row.priceText;
                const price = ownPrice ?? fare ?? row.startingPrice;
                const ownLength = row.lengthText;
                const photo = imageUrl(row.image, 480, 360);
                // "Book" only where the date can be booked online (same
                // test as DepartureRow). It opens Arctic for this
                // departure, or with native booking on, BookingRow's
                // party-size panel under the row. A full date, or one
                // Arctic doesn't list, gets a plain "View Trip" to the
                // date's page.
                const seats = departure?.remainingopenings ?? null;
                const bookable = Boolean(
                    seats !== null && seats > 0 && departure?.onlinebookingurl,
                );
                // Keys: under native booking these cells cross the RSC
                // boundary as BookingRow's dateSlot, where React wants
                // keys on the fragment's children (see DepartureRow).
                const photoCell = (
                    <div
                        key='photo'
                        className='relative row-span-2 aspect-[4/3] self-start overflow-hidden bg-sand/40 sm:row-span-1'
                    >
                        {photo && (
                            <Image
                                src={photo}
                                alt={row.image?.alt ?? ''}
                                fill
                                className='object-cover'
                                sizes='(min-width: 640px) 220px, 96px'
                            />
                        )}
                        {/* The name beside it is the same link, so
                                this one stays out of the tab order. */}
                        {row.href && (
                            <Link
                                href={row.href}
                                aria-hidden
                                tabIndex={-1}
                                className='absolute inset-0'
                            />
                        )}
                    </div>
                );
                const textCell = (
                    <div key='text'>
                        <div>
                            <span className='font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-onyx'>
                                {formatDateRange(
                                    row.startDate,
                                    departure?.duration,
                                )}
                                , {row.startDate.slice(0, 4)}
                            </span>
                            {ownLength ? (
                                <span className='ml-3 whitespace-nowrap text-[13px] text-onyx/70'>
                                    {ownLength}
                                </span>
                            ) : (
                                days &&
                                days > 1 && (
                                    <span className='ml-3 whitespace-nowrap text-[13px] text-onyx/70'>
                                        {days} days
                                    </span>
                                )
                            )}
                        </div>
                        <div className='mt-1 text-paragraph font-bold leading-paragraph text-holiday-red'>
                            {row.href ? (
                                <Link
                                    href={row.href}
                                    className='underline decoration-holiday-red/40 underline-offset-4 transition-opacity hover:opacity-70'
                                >
                                    {row.label}
                                </Link>
                            ) : (
                                row.label
                            )}
                        </div>
                        <div className='mt-0.5 text-body leading-body text-onyx/80'>
                            {row.tripName}
                            {price && (
                                <>
                                    {' '}
                                    &middot;{' '}
                                    {ownPrice ? price : `Starts at ${price}`}
                                </>
                            )}
                        </div>
                        {row.note && (
                            <p className='mt-1.5 max-w-prose text-body leading-body text-onyx/80'>
                                {row.note}
                            </p>
                        )}
                    </div>
                );
                const actions = 'justify-self-start sm:justify-self-end';
                return (
                    <li
                        key={row.key}
                        // Thumbnail column on every width. On phones the
                        // seats and button drop under the text, beside the
                        // photo's column.
                        className='grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-5 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:gap-x-6'
                    >
                        {bookable &&
                        nativeBookingEnabled() &&
                        departure?.triptypeid ? (
                            <BookingRow
                                departureId={departure.id}
                                triptypeid={departure.triptypeid}
                                seatsRemaining={seats ?? 0}
                                fallbackUrl={departure.onlinebookingurl ?? '#'}
                                dateLabel={`${row.label}, ${formatDateRange(
                                    row.startDate,
                                    departure.duration,
                                )}`}
                                dateSlot={[photoCell, textCell]}
                                badgeSlot={
                                    <SeatsBadge key='badge' seats={seats} />
                                }
                                actionsClassName={actions}
                            />
                        ) : (
                            <>
                                {photoCell}
                                {textCell}
                                <div
                                    className={`flex flex-wrap items-center gap-4 ${actions}`}
                                >
                                    <SeatsBadge seats={seats} />
                                    {bookable ? (
                                        <ExternalLink
                                            href={
                                                departure?.onlinebookingurl ??
                                                '#'
                                            }
                                            // ExternalLink supplies its own
                                            // inline-flex.
                                            className={buttonClasses({
                                                variant: 'primary',
                                                display: '',
                                                className: 'text-center',
                                            })}
                                        >
                                            Book
                                        </ExternalLink>
                                    ) : (
                                        row.href && (
                                            <Link
                                                href={row.href}
                                                className={buttonClasses({
                                                    variant: 'outline',
                                                    className: 'text-center',
                                                })}
                                            >
                                                View Trip
                                            </Link>
                                        )
                                    )}
                                </div>
                            </>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
