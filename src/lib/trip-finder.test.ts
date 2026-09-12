import { describe, expect, test } from 'vitest';
import {
    answeredQuestionCount,
    answersToParams,
    completedStepCount,
    currentStep,
    DEFAULT_TRIP_FINDER_SPEC,
    effectiveMinAge,
    emptyAnswers,
    isApplicable,
    lastAnsweredQuestion,
    parseTripFinderParams,
    isConfidentMatch,
    resolveMonthValue,
    scoreTrips,
    selectMatches,
    shortfallReason,
    stepInfo,
    type TripFinderAnswers,
    type TripFinderSpec,
    type TripFinderTrip,
} from './trip-finder';

const spec = DEFAULT_TRIP_FINDER_SPEC;

function trip(overrides: Partial<TripFinderTrip> = {}): TripFinderTrip {
    return {
        _id: 'trip-test',
        name: 'Test Trip',
        slug: { _type: 'slug', current: 'test-trip' },
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

function answers(
    overrides: Partial<TripFinderAnswers> = {},
): TripFinderAnswers {
    return { ...emptyAnswers(), ...overrides };
}

const biking = {
    name: 'Biking',
    cardLabel: null,
    tagColor: 'sand' as const,
    slug: { _type: 'slug' as const, current: 'biking' },
};

describe('stepInfo', () => {
    test('age shares the who slot; rafters walk five miles', () => {
        expect(stepInfo(spec, answers(), 'who')).toEqual({
            number: 1,
            total: 5,
        });
        expect(stepInfo(spec, answers({ who: 'kids' }), 'age').number).toBe(1);
        expect(stepInfo(spec, answers(), 'thrill')).toEqual({
            number: 5,
            total: 5,
        });
    });

    test('bikers walk four miles — no whitewater question on a trail', () => {
        const biker = answers({ activity: 'bike' });
        expect(stepInfo(spec, biker, 'month')).toEqual({ number: 3, total: 4 });
        // thrill is off the path entirely
        expect(stepInfo(spec, biker, 'thrill').number).toBe(0);
    });
});

describe('parseTripFinderParams', () => {
    test('accepts values the spec offers, and skip everywhere', () => {
        expect(
            parseTripFinderParams(spec, {
                who: 'kids',
                age: '8-12',
                month: '7',
                days: 'classic',
                thrill: 'splash',
                activity: 'raft',
            }),
        ).toEqual({
            who: 'kids',
            age: '8-12',
            month: '7',
            days: 'classic',
            thrill: 'splash',
            activity: 'raft',
        });
        expect(parseTripFinderParams(spec, { month: 'skip' }).month).toBe(
            'skip',
        );
    });

    test('garbage collapses to unanswered, never throws', () => {
        const parsed = parseTripFinderParams(spec, {
            who: 'aliens',
            age: ['8-12', '5-7'],
            month: '13',
            days: '<script>',
            thrill: '',
            activity: undefined,
        });
        expect(parsed).toEqual(answers());
    });

    test('a month the spec does not offer is unanswered, not a number', () => {
        // The default spec runs April–October; a shared January link
        // restarts the month question rather than matching nothing.
        expect(parseTripFinderParams(spec, { month: '1' }).month).toBeNull();
    });
});

describe('currentStep', () => {
    test('walks questions in order, activity right after who', () => {
        expect(currentStep(spec, answers())).toBe('who');
        expect(currentStep(spec, answers({ who: 'kids' }))).toBe('age');
        expect(currentStep(spec, answers({ who: 'kids', age: '5-7' }))).toBe(
            'activity',
        );
    });

    test('adults skip the age follow-up', () => {
        expect(currentStep(spec, answers({ who: 'adults' }))).toBe('activity');
    });

    test('bikers reach results without ever seeing the thrill question', () => {
        expect(
            currentStep(
                spec,
                answers({
                    who: 'adults',
                    activity: 'bike',
                    month: '9',
                    days: 'classic',
                }),
            ),
        ).toBe('results');
    });

    test('all answered or skipped reaches results', () => {
        expect(
            currentStep(
                spec,
                answers({
                    who: 'skip',
                    month: 'skip',
                    days: 'skip',
                    thrill: 'skip',
                    activity: 'skip',
                }),
            ),
        ).toBe('results');
    });
});

describe('answersToParams', () => {
    const base = answers({ who: 'kids', age: '8-12', month: '7' });

    test('serializes answered questions in spec order', () => {
        expect(answersToParams(spec, base)).toBe('who=kids&age=8-12&month=7');
    });

    test('overrides add an answer', () => {
        expect(answersToParams(spec, base, { days: 'classic' })).toBe(
            'who=kids&age=8-12&month=7&days=classic',
        );
    });

    test('null override drops one answer', () => {
        expect(answersToParams(spec, base, { month: null })).toBe(
            'who=kids&age=8-12',
        );
    });

    test('dropping who also drops age', () => {
        expect(answersToParams(spec, base, { who: null })).toBe('month=7');
    });
});

describe('progress honesty', () => {
    test('step 1 completes only once the kids follow-up is resolved', () => {
        expect(completedStepCount(spec, answers({ who: 'kids' }))).toBe(0);
        expect(
            completedStepCount(spec, answers({ who: 'kids', age: '5-7' })),
        ).toBe(1);
        expect(completedStepCount(spec, answers({ who: 'adults' }))).toBe(1);
    });

    test('skips complete steps but carry no answered signal', () => {
        const all = answers({
            who: 'skip',
            month: 'skip',
            days: 'skip',
            thrill: 'big',
            activity: 'skip',
        });
        expect(completedStepCount(spec, all)).toBe(5);
        expect(answeredQuestionCount(spec, all)).toBe(1);
    });
});

describe('lastAnsweredQuestion', () => {
    test('finds the most recent answer for the Back link', () => {
        expect(lastAnsweredQuestion(spec, answers())).toBeNull();
        expect(
            lastAnsweredQuestion(spec, answers({ who: 'kids', age: '5-7' })),
        ).toBe('age');
    });
});

describe('spec-driven rules', () => {
    // A trimmed, reordered spec with its own conditions — what Holiday
    // could publish from the Studio.
    const custom: TripFinderSpec = {
        source: 'sanity',
        tuning: { minConfidentScore: 0.5, resultsShown: 2 },
        questions: [
            {
                id: 'activity',
                title: 'Raft or ride?',
                shortLabel: 'Type',
                skipLabel: 'Skip',
                image: '/x.jpg',
                imageAlt: 'x',
                weight: 2,
                options: [
                    { value: 'water', label: 'Water', tripTypeSlug: 'rafting' },
                    { value: 'dirt', label: 'Dirt', tripTypeSlug: 'biking' },
                ],
            },
            {
                id: 'thrill',
                title: 'How wet?',
                shortLabel: 'Wet',
                skipLabel: 'Skip',
                image: '/x.jpg',
                imageAlt: 'x',
                weight: 4,
                onlyWhen: { question: 'activity', answer: 'water' },
                options: [
                    { value: 'dry', label: 'Dry', targetClass: 2 },
                    { value: 'soaked', label: 'Soaked', targetClass: 4 },
                ],
            },
            {
                id: 'days',
                title: 'How long?',
                shortLabel: 'Days',
                skipLabel: 'Skip',
                image: '/x.jpg',
                imageAlt: 'x',
                weight: 1,
                skipWhen: { question: 'activity', answer: 'dirt' },
                options: [{ value: 'week', label: 'A week', centerDays: 7 }],
            },
        ],
    };

    test('onlyWhen makes a follow-up that shares its parent slot', () => {
        expect(isApplicable(custom, 'thrill', answers())).toBe(false);
        expect(
            isApplicable(custom, 'thrill', answers({ activity: 'water' })),
        ).toBe(true);
        expect(
            stepInfo(custom, answers({ activity: 'water' }), 'thrill'),
        ).toEqual({ number: 1, total: 2 });
        expect(currentStep(custom, answers({ activity: 'water' }))).toBe(
            'thrill',
        );
    });

    test('skipWhen drops a question for that path', () => {
        const dirt = answers({ activity: 'dirt' });
        expect(isApplicable(custom, 'days', dirt)).toBe(false);
        expect(currentStep(custom, dirt)).toBe('results');
        expect(stepInfo(custom, dirt, 'activity').total).toBe(1);
    });

    test('kinds the spec does not ask stay null and are never a step', () => {
        const parsed = parseTripFinderParams(custom, {
            who: 'kids',
            activity: 'water',
        });
        expect(parsed.who).toBeNull();
        expect(currentStep(custom, parsed)).toBe('thrill');
    });

    test('dropping a parent drops its follow-up in the query string', () => {
        const base = answers({ activity: 'water', thrill: 'dry' });
        expect(answersToParams(custom, base)).toBe('activity=water&thrill=dry');
        expect(answersToParams(custom, base, { activity: null })).toBe('');
    });

    test('dials drive the matchers, not the option values', () => {
        const [match] = scoreTrips(
            custom,
            [trip({ maxRapidClass: 2 })],
            answers({ activity: 'water', thrill: 'dry' }),
        );
        // activity unknown (no tripType) scores 0.5 at weight 2; thrill
        // target 2 against Class II scores 1 at weight 4.
        expect(match.score).toBeCloseTo((0.5 * 2 + 1 * 4) / 6);
        expect(match.breakdown.map((b) => b.kind)).toEqual([
            'activity',
            'thrill',
        ]);
    });

    test('an activity dial resolves by Trip Type slug', () => {
        const [match] = scoreTrips(
            custom,
            [trip({ tripType: biking })],
            answers({ activity: 'dirt' }),
        );
        expect(match.score).toBe(1);
        expect(match.reasons[0]).toContain('mountain bike');
    });
});

describe('effectiveMinAge', () => {
    const cataract = trip({
        minAge: 8,
        minAgeOverrides: [
            { months: [5, 6], minAge: 16, reason: 'spring high water' },
        ],
    });

    test('returns the base age outside override months', () => {
        expect(effectiveMinAge(cataract, 7)).toBe(8);
        expect(effectiveMinAge(cataract, null)).toBe(8);
    });

    test('applies the override inside its months', () => {
        expect(effectiveMinAge(cataract, 5)).toBe(16);
        expect(effectiveMinAge(cataract, 6)).toBe(16);
    });

    test('null when the trip has no age data', () => {
        expect(effectiveMinAge(trip(), 7)).toBeNull();
    });
});

describe('scoreTrips', () => {
    test('all questions skipped still ranks, alphabetically by slug', () => {
        const ranked = scoreTrips(
            spec,
            [
                trip({ slug: { _type: 'slug', current: 'b-trip' } }),
                trip({ slug: { _type: 'slug', current: 'a-trip' } }),
            ],
            answers({
                who: 'skip',
                month: 'skip',
                days: 'skip',
                thrill: 'skip',
                activity: 'skip',
            }),
        );
        expect(ranked.map((m) => m.trip.slug?.current)).toEqual([
            'a-trip',
            'b-trip',
        ]);
        expect(ranked[0].score).toBe(0.5);
        expect(ranked[0].breakdown).toEqual([]);
    });

    test('unknown data is neutral, not disqualifying', () => {
        const ranked = scoreTrips(
            spec,
            [
                trip({
                    slug: { _type: 'slug', current: 'mismatch' },
                    maxRapidClass: 1,
                }),
                trip({ slug: { _type: 'slug', current: 'unknown' } }),
                trip({
                    slug: { _type: 'slug', current: 'match' },
                    maxRapidClass: 4,
                }),
            ],
            answers({ thrill: 'big' }),
        );
        expect(ranked.map((m) => m.trip.slug?.current)).toEqual([
            'match',
            'unknown',
            'mismatch',
        ]);
        expect(ranked[1].breakdown[0].unknown).toBe(true);
    });

    test('craft variety adds the choose-your-ride reason', () => {
        const [match] = scoreTrips(
            spec,
            [
                trip({
                    maxRapidClass: 3,
                    craftTypes: ['oar-raft', 'paddle-raft', 'inflatable-kayak'],
                }),
            ],
            answers({ thrill: 'splash' }),
        );
        expect(match.reasons.join(' ')).toContain('choose your ride');
    });

    test('month adjacency scores partial credit with a caveat', () => {
        const [match] = scoreTrips(
            spec,
            [trip({ seasonMonths: [5, 6] })],
            answers({ month: '7' }),
        );
        expect(match.score).toBe(0.4);
        expect(match.caveats[0]).toContain('dates nearby');
    });

    test('an age conflict demotes below every clean fit', () => {
        const ranked = scoreTrips(
            spec,
            [
                trip({
                    slug: { _type: 'slug', current: 'great-but-adult' },
                    minAge: 12,
                    maxRapidClass: 3,
                    duration: 5,
                }),
                trip({
                    slug: { _type: 'slug', current: 'kid-friendly' },
                    minAge: 5,
                    maxRapidClass: 1,
                    duration: 5,
                }),
            ],
            answers({
                who: 'kids',
                age: '8-12',
                thrill: 'splash',
                days: 'classic',
            }),
        );
        expect(ranked[0].trip.slug?.current).toBe('kid-friendly');
        expect(ranked[1].ageConflict).toBe(true);
        expect(ranked[0].ageConflict).toBe(false);
    });

    test('a month-driven age conflict names the month that works', () => {
        const cataract = trip({
            minAge: 8,
            seasonMonths: [5, 6, 7, 8, 9],
            minAgeOverrides: [
                { months: [5, 6], minAge: 16, reason: 'spring high water' },
            ],
        });
        const [match] = scoreTrips(
            spec,
            [cataract],
            answers({ who: 'kids', age: '8-12', month: '6' }),
        );
        expect(match.ageConflict).toBe(true);
        expect(match.caveats.join(' ')).toContain(
            'Minimum age is 16 in June — try July, when kids 8+ can come',
        );
    });

    test('ties break toward the trip with more known data', () => {
        // Class 3 against "mellow" (target 1.5) scores exactly 0.5 — the
        // same value unknown data gets — so the two trips tie on score and
        // only the unknown-count tie-break separates them. The known trip
        // sorts first despite losing the slug comparison.
        const ranked = scoreTrips(
            spec,
            [
                trip({ slug: { _type: 'slug', current: 'a-sparse' } }),
                trip({
                    slug: { _type: 'slug', current: 'z-known' },
                    maxRapidClass: 3,
                }),
            ],
            answers({ thrill: 'mellow' }),
        );
        expect(ranked[0].score).toBe(ranked[1].score);
        expect(ranked[0].trip.slug?.current).toBe('z-known');
    });

    test('activity mismatch scores low but never zero', () => {
        const [match] = scoreTrips(
            spec,
            [trip({ tripType: biking })],
            answers({ activity: 'raft' }),
        );
        expect(match.score).toBeGreaterThan(0);
        expect(match.score).toBeLessThan(0.5);
    });

    test('a whitewater answer is ignored once the visitor switched to biking', () => {
        // Back-and-forth can leave thrill=big in the URL alongside
        // activity=bike; the skipped question must not score.
        const [match] = scoreTrips(
            spec,
            [trip({ tripType: biking, maxRapidClass: 1 })],
            answers({ activity: 'bike', thrill: 'big' }),
        );
        expect(match.breakdown.map((b) => b.kind)).toEqual(['activity']);
        expect(match.score).toBe(1);
    });

    test('breakdown contributions sum to the weighted score', () => {
        const [match] = scoreTrips(
            spec,
            [
                trip({
                    maxRapidClass: 4,
                    duration: 6,
                    seasonMonths: [7],
                    tripType: biking,
                }),
            ],
            answers({
                who: 'adults',
                activity: 'raft',
                month: '7',
                days: 'classic',
                thrill: 'big',
            }),
        );
        const weight = match.breakdown.reduce((s, b) => s + b.weight, 0);
        const sum = match.breakdown.reduce(
            (s, b) => s + b.weightedContribution,
            0,
        );
        expect(weight).toBe(3 + 2 + 2 + 2);
        expect(match.score).toBeCloseTo(sum / weight);
        expect(
            match.breakdown.find((b) => b.kind === 'activity')?.rawScore,
        ).toBe(0.2);
    });
});

describe('selectMatches', () => {
    const westwater = trip({
        _id: 'trip-westwater',
        name: 'Westwater Canyon',
        slug: { _type: 'slug', current: 'westwater-canyon' },
        maxRapidClass: 4,
        duration: 3,
        seasonMonths: [5, 6, 7, 8, 9],
        minAge: 12,
    });
    const lodore = trip({
        _id: 'trip-lodore',
        name: 'Gates of Lodore',
        slug: { _type: 'slug', current: 'gates-of-lodore' },
        maxRapidClass: 3,
        duration: 4,
        seasonMonths: [5, 6, 7, 8, 9],
        minAge: 7,
    });
    const goTo: TripFinderSpec = {
        ...spec,
        tuning: { ...spec.tuning, fallbackTripSlug: 'westwater-canyon' },
    };

    test('a confident ranking is shown as scored', () => {
        const full = answers({
            who: 'kids',
            age: '8-12',
            month: '7',
            days: 'classic',
            thrill: 'splash',
            activity: 'raft',
        });
        const ranking = scoreTrips(goTo, [westwater, lodore], full);
        expect(isConfidentMatch(goTo, ranking[0], full)).toBe(true);
        const { matches, fallbackApplied } = selectMatches(goTo, ranking, full);
        expect(fallbackApplied).toBe(false);
        expect(matches[0].trip.name).toBe('Gates of Lodore');
    });

    test('one answer is not enough for a Best Match, so the go-to trip leads', () => {
        const thin = answers({ who: 'adults' });
        const ranking = scoreTrips(goTo, [lodore, westwater], thin);
        expect(isConfidentMatch(goTo, ranking[0], thin)).toBe(false);
        const { matches, fallbackApplied } = selectMatches(goTo, ranking, thin);
        expect(fallbackApplied).toBe(true);
        expect(matches[0].trip.name).toBe('Westwater Canyon');
        // The top scorer still follows it; nothing is duplicated.
        expect(matches.map((m) => m.trip.name)).toEqual([
            'Westwater Canyon',
            'Gates of Lodore',
        ]);
    });

    test('an age conflict is reported as such and keeps the scored order', () => {
        const young = answers({
            who: 'kids',
            age: 'u5',
            activity: 'raft',
            month: '7',
            days: 'classic',
            thrill: 'splash',
        });
        const ranking = scoreTrips(goTo, [lodore, westwater], young);
        expect(ranking[0].ageConflict).toBe(true);
        expect(shortfallReason(goTo, ranking[0], young)).toBe('age');
        expect(selectMatches(goTo, ranking, young).fallbackApplied).toBe(false);
    });

    test('a full answer set that scores low keeps the scored order', () => {
        const full = answers({
            who: 'adults',
            activity: 'bike',
            month: '10',
            days: 'epic',
        });
        // Two rafting trips for a biker in October: nothing confident.
        const ranking = scoreTrips(goTo, [lodore, westwater], full);
        expect(isConfidentMatch(goTo, ranking[0], full)).toBe(false);
        expect(shortfallReason(goTo, ranking[0], full)).toBe('low');
        const result = selectMatches(goTo, ranking, full);
        expect(result.fallbackApplied).toBe(false);
        expect(result.matches[0]).toBe(ranking[0]);
    });

    test('no go-to trip, or one the visitor is too young for, keeps the scored order', () => {
        const thin = answers({ who: 'adults' });
        const noGoTo: TripFinderSpec = {
            ...spec,
            tuning: { ...spec.tuning, fallbackTripSlug: undefined },
        };
        const none = selectMatches(
            noGoTo,
            scoreTrips(noGoTo, [lodore], thin),
            thin,
        );
        expect(none.fallbackApplied).toBe(false);

        const young = answers({ who: 'kids', age: '5-7' });
        const ranking = scoreTrips(goTo, [lodore, westwater], young);
        const result = selectMatches(goTo, ranking, young);
        expect(result.fallbackApplied).toBe(false);
        expect(result.matches[0].trip.name).toBe('Gates of Lodore');
    });

    test('respects the results limit', () => {
        const thin = answers({ who: 'adults' });
        const tight: TripFinderSpec = {
            ...goTo,
            tuning: { ...goTo.tuning, resultsShown: 1 },
        };
        const ranking = scoreTrips(tight, [lodore, westwater], thin);
        expect(selectMatches(tight, ranking, thin).matches).toHaveLength(1);
    });
});

describe('resolveMonthValue', () => {
    const august2026 = new Date('2026-08-15T12:00:00Z');

    test('a month still ahead resolves to this year', () => {
        expect(resolveMonthValue(9, august2026)).toBe('2026-09');
    });

    test('the current month resolves to this year', () => {
        expect(resolveMonthValue(8, august2026)).toBe('2026-08');
    });

    test('a month already past rolls to next year', () => {
        expect(resolveMonthValue(5, august2026)).toBe('2027-05');
    });
});
