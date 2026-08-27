import { describe, expect, test } from 'vitest';
import {
    answersToParams,
    currentStep,
    effectiveMinAge,
    lastAnsweredQuestion,
    parseTripFinderParams,
    resolveMonthValue,
    scoreTrips,
    TOTAL_STEPS,
    TRIP_FINDER_QUESTIONS,
    type TripFinderAnswers,
    type TripFinderTrip,
} from './trip-finder';

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
        activities: null,
        category: null,
        image: null,
        ...overrides,
    };
}

function answers(
    overrides: Partial<TripFinderAnswers> = {},
): TripFinderAnswers {
    return {
        who: null,
        age: null,
        month: null,
        days: null,
        thrill: null,
        activity: null,
        ...overrides,
    };
}

describe('TRIP_FINDER_QUESTIONS', () => {
    test('covers five progress steps with age sharing the who slot', () => {
        const steps = TRIP_FINDER_QUESTIONS.map((q) => q.step);
        expect(Math.max(...steps)).toBe(TOTAL_STEPS);
        const who = TRIP_FINDER_QUESTIONS.find((q) => q.id === 'who');
        const age = TRIP_FINDER_QUESTIONS.find((q) => q.id === 'age');
        expect(who?.step).toBe(age?.step);
    });
});

describe('parseTripFinderParams', () => {
    test('accepts valid values and skip everywhere', () => {
        expect(
            parseTripFinderParams({
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
            month: 7,
            days: 'classic',
            thrill: 'splash',
            activity: 'raft',
        });
        expect(parseTripFinderParams({ month: 'skip' }).month).toBe('skip');
    });

    test('garbage collapses to unanswered, never throws', () => {
        const parsed = parseTripFinderParams({
            who: 'aliens',
            age: ['8-12', '5-7'],
            month: '13',
            days: '<script>',
            thrill: '',
            activity: undefined,
        });
        expect(parsed).toEqual(answers());
    });
});

describe('currentStep', () => {
    test('walks questions in order', () => {
        expect(currentStep(answers())).toBe('who');
        expect(currentStep(answers({ who: 'kids' }))).toBe('age');
        expect(currentStep(answers({ who: 'kids', age: '5-7' }))).toBe('month');
    });

    test('adults skip the age follow-up', () => {
        expect(currentStep(answers({ who: 'adults' }))).toBe('month');
    });

    test('all answered or skipped reaches results', () => {
        expect(
            currentStep(
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
    const base = answers({ who: 'kids', age: '8-12', month: 7 });

    test('serializes answered questions in canonical order', () => {
        expect(answersToParams(base)).toBe('who=kids&age=8-12&month=7');
    });

    test('overrides add an answer', () => {
        expect(answersToParams(base, { days: 'classic' })).toBe(
            'who=kids&age=8-12&month=7&days=classic',
        );
    });

    test('null override drops one answer', () => {
        expect(answersToParams(base, { month: null })).toBe(
            'who=kids&age=8-12',
        );
    });

    test('dropping who also drops age', () => {
        expect(answersToParams(base, { who: null })).toBe('month=7');
    });
});

describe('lastAnsweredQuestion', () => {
    test('finds the most recent answer for the Back link', () => {
        expect(lastAnsweredQuestion(answers())).toBeNull();
        expect(lastAnsweredQuestion(answers({ who: 'kids', age: '5-7' }))).toBe(
            'age',
        );
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
    });

    test('unknown data is neutral, not disqualifying', () => {
        const ranked = scoreTrips(
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
    });

    test('craft variety adds the choose-your-ride reason', () => {
        const [match] = scoreTrips(
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
            [trip({ seasonMonths: [5, 6] })],
            answers({ month: 7 }),
        );
        expect(match.score).toBe(0.4);
        expect(match.caveats[0]).toContain('dates nearby');
    });

    test('an age conflict demotes below every clean fit', () => {
        const ranked = scoreTrips(
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
            [cataract],
            answers({ who: 'kids', age: '8-12', month: 6 }),
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
            [
                trip({
                    activities: [
                        {
                            name: 'Mountain Biking',
                            slug: { _type: 'slug', current: 'biking' },
                        },
                    ],
                }),
            ],
            answers({ activity: 'raft' }),
        );
        expect(match.score).toBeGreaterThan(0);
        expect(match.score).toBeLessThan(0.5);
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
