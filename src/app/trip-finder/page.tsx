import type { Metadata } from 'next';
import {
    TripFinderResults,
    type ResultAvailability,
} from '@/components/ui/TripFinderResults';
import { TripFinderLogicPanel } from '@/components/ui/TripFinderLogicPanel';
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
    chosenMonth,
    currentStep,
    parseArcticIds,
    parseTripFinderParams,
    resolveMonthValue,
    scoreTrips,
} from '@/lib/trip-finder';
import { resolveTripFinderSpec } from '@/lib/trip-finder-spec';

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
    // The questions are content: the Sanity "Trip Finder" document, or the
    // in-code default when that is missing or malformed.
    const [params, spec] = await Promise.all([
        searchParams,
        resolveTripFinderSpec(),
    ]);
    const answers = parseTripFinderParams(spec, params);

    if (currentStep(spec, answers) !== 'results') {
        // The catalog is ranked on every step too, so the logic panel can
        // show the running order as answers land. One cached Sanity read.
        const trips = await getTripFinderTrips();
        return (
            <>
                <TripFinderWizard spec={spec} answers={answers} />
                <TripFinderLogicPanel
                    spec={spec}
                    answers={answers}
                    ranking={scoreTrips(spec, trips, answers)}
                    arctic={null}
                />
            </>
        );
    }

    // Results: rank the catalog, then attach live availability. Arctic
    // being down must never block recommendations — cards degrade to the
    // phone line (same posture as /book).
    const [trips, departures, tripTypes] = await Promise.all([
        getTripFinderTrips(),
        getAllUpcomingDepartures(),
        getBookableTripTypes(),
    ]);

    const ranking = scoreTrips(spec, trips, answers);
    const matches = ranking.slice(0, spec.tuning.resultsShown);
    const arcticDown = departures === null || tripTypes === null;

    const month = chosenMonth(spec, answers);
    const monthValue =
        month !== null ? resolveMonthValue(month, new Date()) : null;

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
        <>
            <TripFinderResults
                spec={spec}
                matches={matches}
                answers={answers}
                availabilityBySlug={availabilityBySlug}
                arcticDown={arcticDown}
            />
            <TripFinderLogicPanel
                spec={spec}
                answers={answers}
                ranking={ranking}
                availabilityBySlug={availabilityBySlug}
                arctic={{
                    down: arcticDown,
                    departures: departures?.length ?? 0,
                    bookableTypes: tripTypes?.length ?? 0,
                }}
            />
        </>
    );
}
