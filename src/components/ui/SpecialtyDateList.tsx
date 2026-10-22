import Image from 'next/image';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/Button';
import { SeatsBadge } from '@/components/ui/DepartureList';
import {
    durationToDays,
    formatDateRange,
    type SpecialtyDateRow,
} from '@/lib/departures';
import { imageUrl } from '@/lib/sanity';

/**
 * The dated departures in one specialty family on /specialty: a photo, the
 * band or theme, the river trip it runs on, live seats and fare, and a link
 * to that date on the trip page. Specialty trips are dates on regular river
 * trips, so a plain trip card here would hide the part people came for.
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
                const price =
                    (departure?.triptypeid != null &&
                        fares.get(departure.triptypeid)) ||
                    row.startingPrice;
                const photo = imageUrl(row.image, 480, 360);
                return (
                    <li
                        key={row.key}
                        // Thumbnail column on every width. On phones the
                        // seats and button drop under the text, beside the
                        // photo's column.
                        className='grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-5 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:gap-x-6'
                    >
                        <div className='relative row-span-2 aspect-[4/3] self-start overflow-hidden bg-sand/40 sm:row-span-1'>
                            {photo && (
                                <Image
                                    src={photo}
                                    alt={row.image?.alt ?? ''}
                                    fill
                                    className='object-cover'
                                    sizes='(min-width: 640px) 220px, 96px'
                                />
                            )}
                        </div>
                        <div>
                            <div>
                                <span className='font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-onyx'>
                                    {formatDateRange(
                                        row.startDate,
                                        departure?.duration,
                                    )}
                                    , {row.startDate.slice(0, 4)}
                                </span>
                                {days && days > 1 && (
                                    <span className='ml-3 whitespace-nowrap text-[13px] text-onyx/70'>
                                        {days} days
                                    </span>
                                )}
                            </div>
                            <div className='mt-1 text-paragraph font-bold leading-paragraph text-holiday-red'>
                                {row.label}
                            </div>
                            <div className='mt-0.5 text-body leading-body text-onyx/80'>
                                {row.tripName}
                                {price && <> &middot; Starts at {price}</>}
                            </div>
                            {row.note && (
                                <p className='mt-1.5 max-w-prose text-body leading-body text-onyx/80'>
                                    {row.note}
                                </p>
                            )}
                        </div>
                        <div className='flex flex-wrap items-center gap-4 justify-self-start sm:justify-self-end'>
                            <SeatsBadge
                                seats={departure?.remainingopenings ?? null}
                            />
                            {row.href && (
                                <Link
                                    href={row.href}
                                    className={buttonClasses({
                                        variant: 'outline',
                                        className: 'text-center',
                                    })}
                                >
                                    View Trip
                                </Link>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
