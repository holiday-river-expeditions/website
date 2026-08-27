import type { Metadata } from 'next';
import {
    TripFinderResults,
    type ResultAvailability,
} from '@/components/ui/TripFinderResults';
import { TripFinderWizard } from '@/components/ui/TripFinderWizard';
import { getAllUpcomingDepartures, getBookableTripTypes } from '@/lib/arctic';
import {
    filterByMonth,
    formatDateRange,
    groupAnchor,
    nextAvailable,
} from '@/lib/departures';
import { getTripFinderTrips } from '@/lib/sanity';
import {
    currentStep,
    parseArcticIds,
    parseTripFinderParams,
    resolveMonthValue,
    scoreTrips,
} from '@/lib/trip-finder';

// Availability on the results screen changes as reservations come in.
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Find Your Trip',
    description:
        'Answer five quick questions and get matched to the Holiday River Expeditions rafting or biking trip that fits your crew, your dates, and your appetite for whitewater.',
};

export default async function TripFinderPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const answers = parseTripFinderParams(params);

    if (currentStep(answers) !== 'results') {
        return <TripFinderWizard answers={answers} />;
    }

    // Results: rank the catalog, then attach live availability. Arctic
    // being down must never block recommendations — cards degrade to the
    // phone line (same posture as /book).
    const [trips, departures, tripTypes] = await Promise.all([
        getTripFinderTrips(),
        getAllUpcomingDepartures(),
        getBookableTripTypes(),
    ]);

    const matches = scoreTrips(trips, answers).slice(0, 3);

    const monthValue =
        typeof answers.month === 'number'
            ? resolveMonthValue(answers.month, new Date())
            : null;

    const availabilityBySlug = new Map<string, ResultAvailability>();
    if (departures !== null && tripTypes !== null) {
        const publicTypeIds = new Set(tripTypes.map((t) => t.id));
        for (const match of matches) {
            const slug = match.trip.slug?.current;
            if (!slug) continue;
            const ids = new Set(parseArcticIds(match.trip.arcticTripId));
            const tripDepartures = departures.filter(
                (d) =>
                    typeof d.triptypeid === 'number' &&
                    ids.has(d.triptypeid) &&
                    publicTypeIds.has(d.triptypeid),
            );
            // Prefer a date in the chosen month; fall back to any month
            // rather than showing nothing.
            const inMonth = filterByMonth(tripDepartures, monthValue);
            const next =
                nextAvailable(inMonth) ?? nextAvailable(tripDepartures);
            if (!next) continue;
            const matchedMonth = inMonth.includes(next);
            availabilityBySlug.set(slug, {
                dateLabel: formatDateRange(next.start, next.duration),
                remaining: next.remainingopenings ?? null,
                bookHref: `/book${
                    matchedMonth && monthValue ? `?month=${monthValue}` : ''
                }#${groupAnchor(`sanity:${slug}`)}`,
            });
        }
    }

    return (
        <TripFinderResults
            matches={matches}
            answers={answers}
            availabilityBySlug={availabilityBySlug}
            arcticDown={departures === null || tripTypes === null}
        />
    );
}
