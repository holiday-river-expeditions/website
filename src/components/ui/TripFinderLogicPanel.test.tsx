import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import {
    DEFAULT_TRIP_FINDER_SPEC,
    emptyAnswers,
    scoreTrips,
    type TripFinderTrip,
} from '@/lib/trip-finder';
import { TripFinderLogicPanel } from './TripFinderLogicPanel';

function trip(overrides: Partial<TripFinderTrip>): TripFinderTrip {
    return {
        _id: overrides.slug?.current ?? 'trip',
        name: 'Trip',
        slug: { _type: 'slug', current: 'trip' },
        tagline: null,
        subtitle: null,
        ribbon: null,
        startingPrice: null,
        durationLabel: null,
        duration: null,
        minAge: null,
        minAgeOverrides: null,
        maxRapidClass: null,
        seasonMonths: null,
        craftTypes: null,
        arcticTripId: null,
        river: null,
        tripType: null,
        image: null,
        ...overrides,
    };
}

const rafting = {
    name: 'Rafting',
    cardLabel: null,
    tagColor: 'teal' as const,
    slug: { _type: 'slug' as const, current: 'rafting' },
};

const complete = trip({
    name: 'Cataract Canyon',
    slug: { _type: 'slug', current: 'cataract-canyon' },
    duration: 6,
    minAge: 8,
    maxRapidClass: 4,
    seasonMonths: [5, 6, 7, 8, 9],
    craftTypes: ['oar-raft', 'inflatable-kayak'],
    arcticTripId: '37,38',
    tripType: rafting,
});
const sparse = trip({
    name: 'Mystery Float',
    slug: { _type: 'slug', current: 'mystery-float' },
    tripType: rafting,
});

const spec = DEFAULT_TRIP_FINDER_SPEC;

describe('TripFinderLogicPanel', () => {
    test('names the source, the current question, and the URL state', () => {
        const answers = { ...emptyAnswers(), who: 'kids' };
        render(
            <TripFinderLogicPanel
                spec={spec}
                answers={answers}
                ranking={scoreTrips(spec, [complete, sparse], answers)}
                arctic={null}
            />,
        );
        expect(screen.getByText(/built-in fallback/i)).toBeInTheDocument();
        expect(
            screen.getByText(/how old is your youngest/i),
        ).toBeInTheDocument();
        expect(screen.getByText('/trip-finder?who=kids')).toBeInTheDocument();
        // Arctic isn't consulted on a wizard step.
        expect(
            screen.getByText(/not consulted until the results page/i),
        ).toBeInTheDocument();
    });

    test('ranks the whole catalog with a per-question breakdown', () => {
        const answers = {
            ...emptyAnswers(),
            who: 'adults',
            activity: 'raft',
            thrill: 'big',
            days: 'classic',
        };
        const ranking = scoreTrips(spec, [sparse, complete], answers);
        render(
            <TripFinderLogicPanel
                spec={spec}
                answers={answers}
                ranking={ranking}
                availabilityBySlug={
                    new Map([
                        [
                            'cataract-canyon',
                            {
                                dateLabel: 'Jul 12 – Jul 17',
                                remaining: 4,
                                bookHref: '/book',
                            },
                        ],
                    ])
                }
                arctic={{ down: false, departures: 12, bookableTypes: 5 }}
            />,
        );
        const items = within(
            screen.getByRole('list', { name: 'Ranking' }),
        ).getAllByRole('listitem');
        expect(items[0]).toHaveTextContent(/1\. Cataract Canyon/);
        expect(items[0]).toHaveTextContent(/shown/);
        expect(items[1]).toHaveTextContent(/2\. Mystery Float/);
        expect(items[1]).toHaveTextContent(/2 unknown/);

        // Breakdown rows read the trip's facts and the answer's dial.
        const cataract = within(items[0]);
        expect(cataract.getByText('Class 4.5')).toBeInTheDocument();
        expect(
            cataract.getByText(/Class 4 · oar-raft, inflatable-kayak/),
        ).toBeInTheDocument();

        // Arctic join and status.
        expect(screen.getByText(/12 upcoming departures/)).toBeInTheDocument();
        expect(screen.getByText('trip type 37, 38')).toBeInTheDocument();
        expect(
            screen.getByText('Jul 12 – Jul 17, 4 seats'),
        ).toBeInTheDocument();

        // Completeness worklist names the sparse trip's gaps.
        expect(
            screen.getByText(/Duration, Minimum Age, Max Rapid Class/),
        ).toBeInTheDocument();
    });
});
