import type { TripFinderTripsQueryResult } from '@/sanity/types';

/**
 * Pure logic for the Find Your Trip wizard: URL-param parsing, step and
 * progress rules, and the matching/scoring model. Kept free of fetching/JSX
 * so every rule is directly unit-testable (same posture as departures.ts).
 *
 * The questions themselves — copy, photos, order, weights, and what each
 * answer means to the matcher — are content, not code. They arrive as a
 * `TripFinderSpec`: normally the Sanity "Trip Finder" singleton (resolved in
 * trip-finder-spec.ts), with `DEFAULT_TRIP_FINDER_SPEC` below as the
 * permanent fallback so an empty or malformed document never blanks the
 * wizard. Every function here takes the spec first.
 *
 * The wizard's entire state is the URL query string. Every answer option is
 * a link that adds one param; the server derives the current step as the
 * first unanswered question. `skip` is a first-class answer everywhere —
 * skipped questions drop out of both sides of the scoring average, they
 * never penalize.
 *
 * Matching scores, it does not filter: with most of the catalog not yet
 * carrying wizard fields, a trip with missing data scores a neutral 0.5 on
 * that question (unknown ≠ disqualified). The one hard signal is a minimum
 * age the youngest guest fails, which demotes the trip below every clean
 * fit rather than hiding it.
 */

export type TripFinderTrip = TripFinderTripsQueryResult[number];

// --- Spec shape ---

/** The built-in matchers. Each doubles as its question's URL param, so a
    reworded question keeps old shared links working. One question per kind. */
export type QuestionKind =
    'who' | 'age' | 'activity' | 'month' | 'days' | 'thrill';

export const QUESTION_KINDS: readonly QuestionKind[] = [
    'who',
    'age',
    'activity',
    'month',
    'days',
    'thrill',
];

export interface QuestionOption {
    /** URL token, e.g. `splash`. `skip` is reserved. */
    value: string;
    label: string;
    sublabel?: string;
    /** Sublabel variant shown once the visitor chose biking — e.g. month
        options describe trail season instead of water state. */
    bikeSublabel?: string;
    // The dial: what this answer means to its kind's matcher. Exactly one
    // applies per kind; the rest stay undefined.
    /** thrill: rapid class the visitor is asking for (1–5, decimals ok). */
    targetClass?: number;
    /** age: the youngest a guest could be — the age a minimum must allow. */
    floorAge?: number;
    /** days: ideal trip length. */
    centerDays?: number;
    /** month: 1–12. */
    month?: number;
    /** activity: the Trip Type slug this answer asks for. */
    tripTypeSlug?: string;
}

/** "When [question] is [answer value]." */
export interface QuestionCondition {
    question: QuestionKind;
    answer: string;
}

export interface TripFinderQuestion {
    id: QuestionKind;
    title: string;
    /** Optional reassurance/context line under the title. */
    subline?: string;
    /** Chip prefix on the results screen, e.g. "Youngest: 8–12". */
    shortLabel: string;
    /** Full-bleed background for this screen: a public/ path or a Sanity
        image URL. */
    image: string;
    imageAlt: string;
    /** One quiet brand line in the screen's footer. */
    ethos?: string;
    /** How much the question counts toward the pick. Ignored for `who`. */
    weight: number;
    /** Makes this a follow-up: asked only when its parent has this answer,
        and sharing the parent's slot on the progress line. */
    onlyWhen?: QuestionCondition;
    /** Dropped for visitors who gave this answer elsewhere. */
    skipWhen?: QuestionCondition;
    options: readonly QuestionOption[];
    skipLabel: string;
}

export interface TripFinderTuning {
    /** Below this, the "best match" isn't one — lead with the call-us line. */
    minConfidentScore: number;
    /** One best match plus this many minus one alternates. */
    resultsShown: number;
}

export interface TripFinderSpec {
    /** Where the questions came from — surfaced by the logic panel. */
    source: 'sanity' | 'fallback';
    questions: readonly TripFinderQuestion[];
    tuning: TripFinderTuning;
}

/** One answer per kind: an option value, `skip`, or null when unanswered.
    Kinds the spec doesn't ask stay null. */
export type TripFinderAnswers = Record<QuestionKind, string | null>;

export const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export const DEFAULT_TUNING: TripFinderTuning = {
    minConfidentScore: 0.35,
    resultsShown: 3,
};

/**
 * The in-code fallback: the sample questions drafted from ARTA's
 * choose-a-trip hierarchy and NN/g guided-selling guidance (need-based
 * wording, everything skippable). The Sanity "Trip Finder" document was
 * seeded from this array (scripts/seed-trip-finder-spec.mjs); Holiday edits
 * there. Weights follow ARTA's stated hierarchy — thrill and who-can-come
 * first, then length, timing, and activity.
 */
export const DEFAULT_TRIP_FINDER_SPEC: TripFinderSpec = {
    source: 'fallback',
    tuning: DEFAULT_TUNING,
    questions: [
        {
            id: 'who',
            shortLabel: 'Who',
            title: "Who's in the boat?",
            image: '/trip-finder/who-fiddle-raft.jpg',
            imageAlt:
                'A Holiday raft drifting calm green water while a guest plays fiddle',
            ethos: 'Family-run since 1966.',
            weight: 0,
            options: [
                {
                    value: 'adults',
                    label: 'Adults',
                    sublabel: 'Friends, couples, or just you and the canyon',
                },
                {
                    value: 'kids',
                    label: 'Bringing kids',
                    sublabel: 'Our favorite kind of trip',
                },
            ],
            skipLabel: 'Not sure yet — skip',
        },
        {
            id: 'age',
            shortLabel: 'Youngest',
            title: 'How old is your youngest?',
            subline: "Every river has an age it loves — we'll match yours.",
            image: '/trip-finder/age-duckie-calm.jpg',
            imageAlt:
                'A guest paddling a red inflatable kayak on flat, calm river water',
            ethos: 'Our guides have raised kids on these rivers.',
            weight: 3,
            onlyWhen: { question: 'who', answer: 'kids' },
            options: [
                {
                    value: 'u5',
                    label: 'Under 5',
                    sublabel: 'Little duckling',
                    floorAge: 0,
                },
                {
                    value: '5-7',
                    label: '5–7',
                    sublabel: 'Sandcastle architect',
                    floorAge: 5,
                },
                {
                    value: '8-12',
                    label: '8–12',
                    sublabel: 'Prime rock-skipping age',
                    floorAge: 8,
                },
                {
                    value: 'teens',
                    label: 'Teens',
                    sublabel: 'Ready to paddle',
                    floorAge: 13,
                },
            ],
            skipLabel: "Skip — we'll keep every river in play",
        },
        {
            id: 'activity',
            shortLabel: 'Trip type',
            title: 'River or trail?',
            subline: 'Everything after this bends to your answer.',
            image: '/trip-finder/activity-white-rim.jpg',
            imageAlt:
                'A mountain biker riding the White Rim road along the canyon edge',
            ethos: 'Sixty seasons of canyon country.',
            weight: 2,
            options: [
                {
                    value: 'raft',
                    label: 'Rafting',
                    sublabel: 'Whitewater and quiet canyon floats',
                    tripTypeSlug: 'rafting',
                },
                {
                    value: 'bike',
                    label: 'Mountain biking',
                    sublabel: 'The White Rim, the Maze, the Swell',
                    tripTypeSlug: 'biking',
                },
            ],
            skipLabel: 'Surprise me — skip',
        },
        {
            id: 'month',
            shortLabel: 'When',
            title: 'When can you get away?',
            subline: 'Our season runs April through October.',
            image: '/trip-finder/month-golden-canyon.jpg',
            imageAlt:
                'Sunburst over a canyon river at golden hour, rafts beached below',
            ethos: 'The canyon has moods too.',
            weight: 2,
            // River and trail season only — Holiday doesn't run winter trips.
            // Sublabels teach the water states a first-timer can't know.
            options: [
                {
                    value: '4',
                    label: 'April',
                    sublabel: 'First trips, quiet canyons',
                    bikeSublabel: 'Prime desert riding',
                    month: 4,
                },
                {
                    value: '5',
                    label: 'May',
                    sublabel: 'Snowmelt — big, fast, cold',
                    bikeSublabel: 'Warm days, firm trails',
                    month: 5,
                },
                {
                    value: '6',
                    label: 'June',
                    sublabel: 'Peak flow',
                    bikeSublabel: 'Hot — early starts, big skies',
                    month: 6,
                },
                {
                    value: '7',
                    label: 'July',
                    sublabel: 'Warm water, splash fights',
                    bikeSublabel: 'High-desert heat — for the committed',
                    month: 7,
                },
                {
                    value: '8',
                    label: 'August',
                    sublabel: 'Sunny and easygoing',
                    bikeSublabel: 'Monsoon skies, dramatic light',
                    month: 8,
                },
                {
                    value: '9',
                    label: 'September',
                    sublabel: 'Golden cottonwoods, empty canyons',
                    bikeSublabel: 'Prime riding returns',
                    month: 9,
                },
                {
                    value: '10',
                    label: 'October',
                    sublabel: 'Crisp air, last runs',
                    bikeSublabel: 'Cool air, golden light',
                    month: 10,
                },
            ],
            skipLabel: "I'm flexible — skip",
        },
        {
            id: 'days',
            shortLabel: 'Days',
            title: 'How many days do you have?',
            image: '/trip-finder/days-beach-camp.jpg',
            imageAlt:
                'A wide sandy beach camp deep in the canyon, kayaks and rafts pulled ashore',
            ethos: 'No bars. No motors. No hurry.',
            weight: 2,
            options: [
                {
                    value: 'short',
                    label: 'A long weekend',
                    sublabel: '2–3 days',
                    centerDays: 3,
                },
                {
                    value: 'classic',
                    label: 'The classic',
                    sublabel: '4–6 days',
                    centerDays: 5,
                },
                {
                    value: 'epic',
                    label: 'The full disconnect',
                    sublabel: '7+ days — no bars, no hurry',
                    centerDays: 7,
                },
            ],
            skipLabel: 'Not sure — skip',
        },
        {
            id: 'thrill',
            shortLabel: 'Whitewater',
            title: 'How much whitewater do you want?',
            image: '/trip-finder/thrill-eddy-rapid.jpg',
            imageAlt:
                'A Holiday oar raft punching through a whitewater rapid, crew grinning',
            ethos: 'No motors. Ever.',
            weight: 3,
            // A biker never gets asked how much whitewater they want.
            skipWhen: { question: 'activity', answer: 'bike' },
            options: [
                {
                    value: 'mellow',
                    label: 'Mellow float',
                    sublabel:
                        'Quiet water, big canyon — no motor to drown it out',
                    targetClass: 1.5,
                },
                {
                    value: 'splash',
                    label: 'Some splash',
                    sublabel: 'Wet, laughing, fun rapids',
                    targetClass: 3,
                },
                {
                    value: 'big',
                    label: 'Big whitewater',
                    sublabel: 'Class IV — Cataract-grade. Hang on.',
                    targetClass: 4.5,
                },
            ],
            skipLabel: "Guides' call — show me everything",
        },
    ],
};

export function emptyAnswers(): TripFinderAnswers {
    return {
        who: null,
        age: null,
        activity: null,
        month: null,
        days: null,
        thrill: null,
    };
}

// --- Spec lookups ---

export function questionOf(
    spec: TripFinderSpec,
    id: QuestionKind,
): TripFinderQuestion | undefined {
    return spec.questions.find((q) => q.id === id);
}

/** The option the visitor picked for a question; null for skip/unanswered. */
export function chosenOption(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
    id: QuestionKind,
): QuestionOption | null {
    const value = answers[id];
    if (value === null || value === 'skip') return null;
    return questionOf(spec, id)?.options.find((o) => o.value === value) ?? null;
}

/** The chosen month as a number, if the month question was answered. */
export function chosenMonth(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
): number | null {
    return chosenOption(spec, answers, 'month')?.month ?? null;
}

/** Whether the visitor asked for a bike trip — drives the trail-flavoured
    sublabels. Read off the chosen Trip Type, not the option's URL value. */
export function prefersBike(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
): boolean {
    return chosenOption(spec, answers, 'activity')?.tripTypeSlug === 'biking';
}

/** Human label for an answer, for the results screen's edit chips. */
export function answerLabel(
    spec: TripFinderSpec,
    id: QuestionKind,
    value: string,
): string {
    if (value === 'skip') return 'No preference';
    const option = questionOf(spec, id)?.options.find((o) => o.value === value);
    return option?.label ?? value;
}

// --- URL params ---

type RawParams = Record<string, string | string[] | undefined>;

function single(raw: string | string[] | undefined): string | null {
    return typeof raw === 'string' ? raw : null;
}

/** Anything unexpected collapses to "not yet answered" (parseMonthParam's
    posture) — a garbled shared link restarts the question, it never errors.
    Only values the spec actually offers are accepted. */
export function parseTripFinderParams(
    spec: TripFinderSpec,
    params: RawParams,
): TripFinderAnswers {
    const answers = emptyAnswers();
    for (const question of spec.questions) {
        const raw = single(params[question.id]);
        if (raw === null) continue;
        if (raw === 'skip' || question.options.some((o) => o.value === raw)) {
            answers[question.id] = raw;
        }
    }
    return answers;
}

// --- Steps and progress ---

function matches(
    condition: QuestionCondition | undefined,
    answers: TripFinderAnswers,
): boolean {
    return (
        condition !== undefined &&
        answers[condition.question] === condition.answer
    );
}

/** A follow-up applies only once its parent has the required answer; a
    question with a skip rule drops out once that answer is given. */
export function isApplicable(
    spec: TripFinderSpec,
    id: QuestionKind,
    answers: TripFinderAnswers,
): boolean {
    const question = questionOf(spec, id);
    if (!question) return false;
    if (question.onlyWhen && !matches(question.onlyWhen, answers)) {
        return false;
    }
    if (matches(question.skipWhen, answers)) return false;
    return true;
}

/** Top-level steps applicable to this visitor's path: every non-follow-up
    question that isn't skipped (4 for bikers on the default spec). */
function applicableSteps(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
): QuestionKind[] {
    return spec.questions
        .filter((q) => !q.onlyWhen && isApplicable(spec, q.id, answers))
        .map((q) => q.id);
}

/** Honest mile-marker position: which applicable step a question is, and
    how many there are on this path. A follow-up reports its parent's slot. */
export function stepInfo(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
    id: QuestionKind,
): { number: number; total: number } {
    const steps = applicableSteps(spec, answers);
    const slot = questionOf(spec, id)?.onlyWhen?.question ?? id;
    return { number: steps.indexOf(slot) + 1, total: steps.length };
}

/** First unanswered applicable question, or 'results' once none remain. */
export function currentStep(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
): QuestionKind | 'results' {
    for (const question of spec.questions) {
        if (
            isApplicable(spec, question.id, answers) &&
            answers[question.id] === null
        ) {
            return question.id;
        }
    }
    return 'results';
}

/**
 * Query string for a set of answers, in the spec's order. Overrides add an
 * answer (option links), and a null override drops one (Back links, the
 * results screen's edit chips). Dropping a parent also drops its follow-ups
 * — an age band is meaningless without the family context.
 */
export function answersToParams(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
    overrides: Partial<Record<QuestionKind, string | null>> = {},
): string {
    const resolved = { ...answers };
    for (const id of QUESTION_KINDS) {
        if (id in overrides) resolved[id] = overrides[id] ?? null;
    }
    const params = new URLSearchParams();
    for (const question of spec.questions) {
        const value = resolved[question.id];
        if (value === null) continue;
        const parent = question.onlyWhen?.question;
        if (parent !== undefined && resolved[parent] === null) continue;
        params.set(question.id, value);
    }
    return params.toString();
}

/** The last answered question — target of the wizard's Back link. */
export function lastAnsweredQuestion(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
): QuestionKind | null {
    for (let i = spec.questions.length - 1; i >= 0; i--) {
        const id = spec.questions[i].id;
        if (isApplicable(spec, id, answers) && answers[id] !== null) return id;
    }
    return null;
}

/**
 * Fully completed progress steps. A step counts only once its applicable
 * follow-ups are also resolved — honest progress, per NN/g: the current
 * step renders as in-progress, never pre-filled.
 */
export function completedStepCount(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
): number {
    return applicableSteps(spec, answers).filter((id) => {
        if (answers[id] === null) return false;
        return spec.questions
            .filter((q) => q.onlyWhen?.question === id)
            .every(
                (q) =>
                    !isApplicable(spec, q.id, answers) ||
                    answers[q.id] !== null,
            );
    }).length;
}

/** Questions answered with a real preference (skips carry no signal). */
export function answeredQuestionCount(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
): number {
    return spec.questions.filter(
        (q) =>
            isApplicable(spec, q.id, answers) &&
            answers[q.id] !== null &&
            answers[q.id] !== 'skip',
    ).length;
}

/** The answered questions, in order, for the trip log and edit chips. */
export function answeredQuestions(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
): TripFinderQuestion[] {
    return spec.questions.filter(
        (q) => isApplicable(spec, q.id, answers) && answers[q.id] !== null,
    );
}

// --- Matching ---

/** Base minimum age with any month override applied. Null = unknown. */
export function effectiveMinAge(
    trip: Pick<TripFinderTrip, 'minAge' | 'minAgeOverrides'>,
    month: number | null,
): number | null {
    if (month !== null) {
        for (const override of trip.minAgeOverrides ?? []) {
            if (
                override.months?.includes(month) &&
                typeof override.minAge === 'number'
            ) {
                return override.minAge;
            }
        }
    }
    return trip.minAge ?? null;
}

/** The formula constants that stay in code. The doc lists them; the logic
    panel shows them. */
export const SCORING = {
    /** A trip with no data for a question: neutral, never disqualified. */
    unknownScore: 0.5,
    /** Craft variety lets a mixed-appetite crew dial their own thrill. */
    craftBonus: 0.15,
    /** Runs the month before or after the one asked for. */
    adjacentMonthScore: 0.4,
    /** Wrong trip type: low, never zero — score, don't hard-filter. */
    activityMismatchScore: 0.2,
    /** Combo trips run both, so they satisfy either answer — a shade below
        a dedicated trip, which is what someone picking one activity asked for. */
    comboScore: 0.7,
} as const;

/** One question's contribution to a trip's score — the logic panel's rows. */
export interface ScoreBreakdown {
    kind: QuestionKind;
    weight: number;
    rawScore: number;
    weightedContribution: number;
    unknown: boolean;
    reason?: string;
    caveat?: string;
}

export interface TripMatch {
    trip: TripFinderTrip;
    /** 0–1 weighted average over the questions that were answered. */
    score: number;
    /** Top "why it fits" lines, ordered by question weight. */
    reasons: string[];
    /** Warnings worth showing even on a recommended trip. */
    caveats: string[];
    /** The youngest guest fails this trip's minimum age. */
    ageConflict: boolean;
    /** How many answered questions had no trip data — tie-break input. */
    unknownCount: number;
    /** Per-question detail, in spec order. */
    breakdown: ScoreBreakdown[];
}

export interface ScorerResult {
    score: number;
    unknown: boolean;
    reason?: string;
    caveat?: string;
}

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

const UNKNOWN: ScorerResult = { score: SCORING.unknownScore, unknown: true };

function scoreThrill(trip: TripFinderTrip, target: number): ScorerResult {
    const rapidClass = trip.maxRapidClass;
    if (rapidClass == null) return UNKNOWN;
    let score = clamp01(1 - Math.abs(target - rapidClass) / 3);
    let craftDial = false;
    const crafts = trip.craftTypes ?? [];
    if (crafts.length >= 2 && crafts.includes('inflatable-kayak')) {
        score = Math.min(1, score + SCORING.craftBonus);
        craftDial = true;
    }
    const wording =
        target <= 2
            ? 'Mostly calm water — scenery over adrenaline'
            : target < 4
              ? `Fun Class ${rapidClass} rapids — wet and laughing`
              : `Class ${rapidClass} whitewater — the real deal`;
    let reason: string | undefined = score >= 0.75 ? wording : undefined;
    if (craftDial && reason) {
        reason +=
            ' — and you choose your ride, oar boat (mellow) to inflatable kayak (max splash)';
    }
    return { score, unknown: false, reason };
}

function scoreAge(
    trip: TripFinderTrip,
    floor: number,
    month: number | null,
): ScorerResult {
    const minAge = effectiveMinAge(trip, month);
    if (minAge === null) return UNKNOWN;
    if (minAge <= floor) {
        return {
            score: 1,
            unknown: false,
            reason:
                minAge > 0
                    ? `Kids ${minAge}+ welcome${month !== null ? ` in ${MONTH_NAMES[month - 1]}` : ''}`
                    : 'No minimum age — bring the whole family',
        };
    }
    // Failed. If a month override caused it, say which months work instead.
    let caveat = `Minimum age is ${minAge}`;
    if (month !== null) {
        const base = trip.minAge ?? null;
        if (base !== null && base !== minAge && base <= floor) {
            const okMonths = (trip.seasonMonths ?? []).filter(
                (m) => (effectiveMinAge(trip, m) ?? Infinity) <= floor,
            );
            if (okMonths.length > 0) {
                caveat = `Minimum age is ${minAge} in ${MONTH_NAMES[month - 1]} — try ${MONTH_NAMES[okMonths[0] - 1]}, when kids ${base}+ can come`;
            }
        } else {
            caveat = `Minimum age is ${minAge} in ${MONTH_NAMES[month - 1]}`;
        }
    }
    return { score: 0, unknown: false, caveat };
}

function scoreDays(trip: TripFinderTrip, center: number): ScorerResult {
    const duration = trip.duration;
    if (duration == null) return UNKNOWN;
    const score = clamp01(1 - Math.abs(duration - center) / 3);
    return {
        score,
        unknown: false,
        reason:
            score >= 0.75
                ? `${trip.durationLabel ?? `${duration} days`} out there — fits your time`
                : undefined,
    };
}

function scoreMonth(trip: TripFinderTrip, month: number): ScorerResult {
    const seasonMonths = trip.seasonMonths ?? [];
    if (seasonMonths.length === 0) return UNKNOWN;
    if (seasonMonths.includes(month)) {
        return {
            score: 1,
            unknown: false,
            reason: `On the water in ${MONTH_NAMES[month - 1]}`,
        };
    }
    const adjacent =
        seasonMonths.includes(month - 1) || seasonMonths.includes(month + 1);
    return {
        score: adjacent ? SCORING.adjacentMonthScore : 0,
        unknown: false,
        caveat: adjacent
            ? `Season ends just before ${MONTH_NAMES[month - 1]} — dates nearby may work`
            : `Doesn't run in ${MONTH_NAMES[month - 1]}`,
    };
}

function scoreActivity(trip: TripFinderTrip, wantedSlug: string): ScorerResult {
    const slug = trip.tripType?.slug?.current;
    if (!slug) return UNKNOWN;
    if (slug === 'combo') {
        return {
            score: SCORING.comboScore,
            unknown: false,
            reason: 'Paddle and pedal in one trip',
        };
    }
    if (slug === wantedSlug) {
        return {
            score: 1,
            unknown: false,
            reason:
                wantedSlug === 'biking'
                    ? 'Singletrack and slickrock by mountain bike'
                    : 'A river trip through and through',
        };
    }
    return { score: SCORING.activityMismatchScore, unknown: false };
}

/** Route a chosen option to its kind's matcher. Null when the option
    carries no dial (a `who` answer, or a malformed spec entry). */
function scoreQuestion(
    kind: QuestionKind,
    option: QuestionOption,
    trip: TripFinderTrip,
    month: number | null,
): ScorerResult | null {
    switch (kind) {
        case 'thrill':
            return option.targetClass === undefined
                ? null
                : scoreThrill(trip, option.targetClass);
        case 'age':
            return option.floorAge === undefined
                ? null
                : scoreAge(trip, option.floorAge, month);
        case 'days':
            return option.centerDays === undefined
                ? null
                : scoreDays(trip, option.centerDays);
        case 'month':
            return option.month === undefined
                ? null
                : scoreMonth(trip, option.month);
        case 'activity':
            return option.tripTypeSlug === undefined
                ? null
                : scoreActivity(trip, option.tripTypeSlug);
        case 'who':
            return null;
    }
}

/**
 * Ranks trips against the answers. Trips whose minimum age the youngest
 * guest fails sort below every clean fit regardless of score.
 */
export function scoreTrips(
    spec: TripFinderSpec,
    trips: readonly TripFinderTrip[],
    answers: TripFinderAnswers,
): TripMatch[] {
    const month = chosenMonth(spec, answers);

    // Only questions actually on this visitor's path count — a whitewater
    // answer left over from before they switched to biking is ignored.
    const asked = spec.questions.filter(
        (q) =>
            q.id !== 'who' && q.weight > 0 && isApplicable(spec, q.id, answers),
    );

    const matches = trips.map((trip): TripMatch => {
        const breakdown: ScoreBreakdown[] = [];
        let ageResult: ScorerResult | null = null;

        for (const question of asked) {
            const option = chosenOption(spec, answers, question.id);
            if (!option) continue;
            const result = scoreQuestion(question.id, option, trip, month);
            if (!result) continue;
            if (question.id === 'age') ageResult = result;
            breakdown.push({
                kind: question.id,
                weight: question.weight,
                rawScore: result.score,
                weightedContribution: question.weight * result.score,
                unknown: result.unknown,
                reason: result.reason,
                caveat: result.caveat,
            });
        }

        const totalWeight = breakdown.reduce((sum, b) => sum + b.weight, 0);
        const score =
            totalWeight === 0
                ? SCORING.unknownScore
                : breakdown.reduce(
                      (sum, b) => sum + b.weightedContribution,
                      0,
                  ) / totalWeight;

        const reasons = breakdown
            .filter((b) => b.reason)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 3)
            .map((b) => b.reason as string);

        const caveats = breakdown
            .filter((b) => b.caveat)
            .map((b) => b.caveat as string);

        return {
            trip,
            score,
            reasons,
            caveats,
            ageConflict:
                ageResult !== null &&
                !ageResult.unknown &&
                ageResult.score === 0,
            unknownCount: breakdown.filter((b) => b.unknown).length,
            breakdown,
        };
    });

    return matches.sort((a, b) => {
        if (a.ageConflict !== b.ageConflict) return a.ageConflict ? 1 : -1;
        if (a.score !== b.score) return b.score - a.score;
        if (a.unknownCount !== b.unknownCount) {
            return a.unknownCount - b.unknownCount;
        }
        const slugA = a.trip.slug?.current ?? '';
        const slugB = b.trip.slug?.current ?? '';
        return slugA.localeCompare(slugB);
    });
}

/** Sanity's comma-separated Arctic trip-type ids → numeric ids. */
export function parseArcticIds(raw: string | null | undefined): number[] {
    if (!raw) return [];
    return raw
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((id) => Number.isInteger(id) && id > 0);
}

/**
 * Next occurrence of a wizard month as a "YYYY-MM" /book filter value —
 * this year if the month is still ahead (or current), else next year.
 */
export function resolveMonthValue(month: number, today: Date): string {
    const year =
        month >= today.getUTCMonth() + 1
            ? today.getUTCFullYear()
            : today.getUTCFullYear() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
}
