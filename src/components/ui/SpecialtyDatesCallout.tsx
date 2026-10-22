import {
    departureAnchor,
    formatDayLabel,
    type UpcomingSpecialtyDate,
} from '@/lib/departures';

/**
 * Names a trip's specialty dates near the top of the trip page. Otherwise
 * the only mention is a badge in Dates & Availability, the last section.
 * Each date links to its row there (see DepartureHashTarget).
 *
 * Plain anchors, not Link: same-page fragments need native scrolling and a
 * hashchange event, not a router navigation.
 */
export function SpecialtyDatesCallout({
    dates,
}: {
    dates: readonly UpcomingSpecialtyDate[];
}) {
    if (dates.length === 0) return null;
    return (
        <div className='mt-8 bg-sand/40 px-5 py-5 md:px-6'>
            <h2 className='font-alt-gothic text-h3 font-black uppercase leading-h3 text-holiday-red'>
                Specialty Dates
            </h2>
            <ul className='mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-8'>
                {dates.map((date) => (
                    <li key={date.startDate}>
                        <a
                            href={`#${departureAnchor(date.startDate)}`}
                            className='text-body leading-body text-onyx transition-opacity hover:opacity-70'
                        >
                            <span className='font-bold'>
                                {formatDayLabel(date.startDate)}
                            </span>{' '}
                            <span className='underline underline-offset-2'>
                                {date.label}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
