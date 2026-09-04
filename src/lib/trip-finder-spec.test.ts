import { describe, expect, test, vi } from 'vitest';
import type { TripFinderSpecQueryResult } from '@/sanity/types';

vi.mock('@/lib/sanity', () => ({
    getTripFinderSpec: vi.fn(),
    imageUrl: (source: { asset?: { _ref?: string } }) =>
        source.asset?._ref ? `https://cdn.test/${source.asset._ref}.jpg` : '',
}));

import { normalizeTripFinderSpec } from './trip-finder-spec';

type RawQuestion = NonNullable<
    NonNullable<TripFinderSpecQueryResult>['questions']
>[number];

function question(overrides: Partial<RawQuestion> = {}): RawQuestion {
    return {
        _key: 'q',
        kind: 'thrill',
        title: 'How much whitewater?',
        subline: null,
        shortLabel: 'Whitewater',
        skipLabel: 'Skip',
        ethos: null,
        weight: 3,
        image: {
            _type: 'image',
            asset: { _ref: 'image-abc', _type: 'reference' },
            alt: 'A rapid',
        },
        onlyWhen: null,
        skipWhen: null,
        options: [
            {
                _key: 'o1',
                label: 'Some splash',
                value: 'splash',
                sublabel: null,
                bikeSublabel: null,
                targetClass: 3,
                floorAge: null,
                centerDays: null,
                month: null,
                tripTypeSlug: null,
            },
        ],
        ...overrides,
    };
}

function doc(
    questions: RawQuestion[],
    tuning: Partial<NonNullable<TripFinderSpecQueryResult>> = {},
): TripFinderSpecQueryResult {
    return {
        minConfidentScore: null,
        resultsShown: null,
        ...tuning,
        questions,
    };
}

describe('normalizeTripFinderSpec', () => {
    test('a valid document becomes a sanity-sourced spec', () => {
        const result = normalizeTripFinderSpec(
            doc([question()], { minConfidentScore: 0.5, resultsShown: 2 }),
        );
        expect(result.error).toBeUndefined();
        const spec = result.spec!;
        expect(spec.source).toBe('sanity');
        expect(spec.tuning).toEqual({
            minConfidentScore: 0.5,
            resultsShown: 2,
        });
        expect(spec.questions[0]).toMatchObject({
            id: 'thrill',
            weight: 3,
            image: 'https://cdn.test/image-abc.jpg',
            imageAlt: 'A rapid',
            options: [{ value: 'splash', targetClass: 3 }],
        });
    });

    test('missing tuning falls back to the defaults, not to null', () => {
        const { spec } = normalizeTripFinderSpec(doc([question()]));
        expect(spec?.tuning).toEqual({
            minConfidentScore: 0.35,
            resultsShown: 3,
        });
    });

    test('who questions weigh nothing regardless of the field', () => {
        const { spec } = normalizeTripFinderSpec(
            doc([
                question({
                    kind: 'who',
                    weight: 5,
                    options: [
                        {
                            ...question().options![0],
                            value: 'kids',
                            label: 'Kids',
                        },
                    ],
                }),
            ]),
        );
        expect(spec?.questions[0].weight).toBe(0);
    });

    test('no document → error, so the caller falls back', () => {
        expect(normalizeTripFinderSpec(null).error).toMatch(/No Trip Finder/);
    });

    test('duplicate kinds are rejected', () => {
        const { error } = normalizeTripFinderSpec(
            doc([question({ _key: 'a' }), question({ _key: 'b' })]),
        );
        expect(error).toMatch(/One question per kind/);
    });

    test('an answer missing its kind’s dial is rejected', () => {
        const { error } = normalizeTripFinderSpec(
            doc([
                question({
                    options: [{ ...question().options![0], targetClass: null }],
                }),
            ]),
        );
        expect(error).toMatch(/needs targetClass/);
    });

    test('unsafe or reserved answer values are rejected', () => {
        const bad = (value: string) =>
            normalizeTripFinderSpec(
                doc([
                    question({
                        options: [{ ...question().options![0], value }],
                    }),
                ]),
            ).error;
        expect(bad('Some Splash')).toBeDefined();
        expect(bad('skip')).toBeDefined();
    });

    test('a question without a photo is rejected', () => {
        const { error } = normalizeTripFinderSpec(
            doc([question({ image: null })]),
        );
        expect(error).toBeDefined();
    });
});
