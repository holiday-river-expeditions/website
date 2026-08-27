import type { TripFinderTripsQueryResult } from '@/sanity/types';

/**
 * Pure logic for the Find Your Trip wizard: question definitions, URL-param
 * parsing, and the matching/scoring model. Kept free of fetching/JSX so
 * every rule is directly unit-testable (same posture as departures.ts).
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

// --- Questions ---

export type QuestionId =
    'who' | 'age' | 'month' | 'days' | 'thrill' | 'activity';

export type WhoValue = 'adults' | 'kids' | 'skip';
export type AgeValue = 'u5' | '5-7' | '8-12' | 'teens' | 'skip';
export type DaysValue = 'short' | 'classic' | 'epic' | 'skip';
export type ThrillValue = 'mellow' | 'splash' | 'big' | 'skip';
export type ActivityValue = 'raft' | 'bike' | 'both' | 'skip';
/** 1–12, or 'skip' for "I'm flexible". */
export type MonthValue = number | 'skip';

export interface TripFinderAnswers {
    who: WhoValue | null;
    age: AgeValue | null;
    month: MonthValue | null;
    days: DaysValue | null;
    thrill: ThrillValue | null;
    activity: ActivityValue | null;
}

export interface QuestionOption {
    value: string;
    label: string;
    sublabel?: string;
    /** Sublabel variant shown when the visitor already chose biking —
        e.g. month options describe trail season instead of water state. */
    bikeSublabel?: string;
}

export interface TripFinderQuestion {
    id: QuestionId;
    title: string;
    /** Optional reassurance/context line under the title. */
    subline?: string;
    /** Chip prefix on the results screen, e.g. "Youngest: 8–12". */
    shortLabel: string;
    /** Full-bleed background for this screen (public/ path). */
    image: string;
    imageAlt: string;
    /** One quiet brand line in the screen's footer. */
    ethos: string;
    options: QuestionOption[];
    skipLabel: string;
}

const MONTH_NAMES = [
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

/**
 * The five sample questions (drafted from ARTA's choose-a-trip hierarchy and
 * NN/g guided-selling guidance — need-based wording, everything skippable).
 * Lauren revises copy here; this array is the single source of truth for
 * the wizard UI, param validation, and progress display.
 */
export const TRIP_FINDER_QUESTIONS: readonly TripFinderQuestion[] = [
    {
        id: 'who',
        shortLabel: 'Who',
        title: "Who's in the boat?",
        image: '/trip-finder/who-fiddle-raft.jpg',
        imageAlt:
            'A Holiday raft drifting calm green water while a guest plays fiddle',
        ethos: 'Family-run since 1966.',
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
        options: [
            { value: 'u5', label: 'Under 5', sublabel: 'Little duckling' },
            { value: '5-7', label: '5–7', sublabel: 'Sandcastle architect' },
            {
                value: '8-12',
                label: '8–12',
                sublabel: 'Prime rock-skipping age',
            },
            { value: 'teens', label: 'Teens', sublabel: 'Ready to paddle' },
        ],
        skipLabel: "Skip — we'll keep every river in play",
    },
    {
        id: 'activity',
        shortLabel: 'Trip type',
        title: 'River, trail, or both?',
        subline: 'Everything after this bends to your answer.',
        image: '/trip-finder/activity-white-rim.jpg',
        imageAlt:
            'A mountain biker riding the White Rim road along the canyon edge',
        ethos: 'Sixty seasons of canyon country.',
        options: [
            {
                value: 'raft',
                label: 'Rafting',
                sublabel: 'Whitewater and quiet canyon floats',
            },
            {
                value: 'bike',
                label: 'Mountain biking',
                sublabel: 'The White Rim, the Maze, the Swell',
            },
            {
                value: 'both',
                label: 'Raft & ride combo',
                sublabel: 'Pedal the rim, then run the river',
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
        // River and trail season only — Holiday doesn't run winter trips.
        // Sublabels teach the water states a first-timer can't know.
        options: [
            {
                value: '4',
                label: 'April',
                sublabel: 'First trips, quiet canyons',
                bikeSublabel: 'Prime desert riding',
            },
            {
                value: '5',
                label: 'May',
                sublabel: 'Snowmelt — big, fast, cold',
                bikeSublabel: 'Warm days, firm trails',
            },
            {
                value: '6',
                label: 'June',
                sublabel: 'Peak flow',
                bikeSublabel: 'Hot — early starts, big skies',
            },
            {
                value: '7',
                label: 'July',
                sublabel: 'Warm water, splash fights',
                bikeSublabel: 'High-desert heat — for the committed',
            },
            {
                value: '8',
                label: 'August',
                sublabel: 'Sunny and easygoing',
                bikeSublabel: 'Monsoon skies, dramatic light',
            },
            {
                value: '9',
                label: 'September',
                sublabel: 'Golden cottonwoods, empty canyons',
                bikeSublabel: 'Prime riding returns',
            },
            {
                value: '10',
                label: 'October',
                sublabel: 'Crisp air, last runs',
                bikeSublabel: 'Cool air, golden light',
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
        options: [
            {
                value: 'short',
                label: 'A long weekend',
                sublabel: '2–3 days',
            },
            {
                value: 'classic',
                label: 'The classic',
                sublabel: '4–6 days',
            },
            {
                value: 'epic',
                label: 'The full disconnect',
                sublabel: '7+ days — no bars, no hurry',
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
        options: [
            {
                value: 'mellow',
                label: 'Mellow float',
                sublabel: 'Quiet water, big canyon — no motor to drown it out',
            },
            {
                value: 'splash',
                label: 'Some splash',
                sublabel: 'Wet, laughing, fun rapids',
            },
            {
                value: 'big',
                label: 'Big whitewater',
                sublabel: 'Class IV — Cataract-grade. Hang on.',
            },
        ],
        skipLabel: "Guides' call — show me everything",
    },
];

/** Human label for an answer, for the results screen's edit chips. */
export function answerLabel(id: QuestionId, value: string | number): string {
    if (value === 'skip') return 'No preference';
    if (id === 'month' && typeof value === 'number') {
        return MONTH_NAMES[value - 1] ?? String(value);
    }
    const question = TRIP_FINDER_QUESTIONS.find((q) => q.id === id);
    const option = question?.options.find((o) => o.value === String(value));
    return option?.label ?? String(value);
}

// --- URL params ---

const WHO_VALUES = new Set(['adults', 'kids', 'skip']);
const AGE_VALUES = new Set(['u5', '5-7', '8-12', 'teens', 'skip']);
const DAYS_VALUES = new Set(['short', 'classic', 'epic', 'skip']);
const THRILL_VALUES = new Set(['mellow', 'splash', 'big', 'skip']);
const ACTIVITY_VALUES = new Set(['raft', 'bike', 'both', 'skip']);

type RawParams = Record<string, string | string[] | undefined>;

function single(raw: string | string[] | undefined): string | null {
    return typeof raw === 'string' ? raw : null;
}

/** Anything unexpected collapses to "not yet answered" (parseMonthParam's
    posture) — a garbled shared link restarts the question, it never errors. */
export function parseTripFinderParams(params: RawParams): TripFinderAnswers {
    const who = single(params.who);
    const age = single(params.age);
    const month = single(params.month);
    const days = single(params.days);
    const thrill = single(params.thrill);
    const activity = single(params.activity);

    let monthValue: MonthValue | null = null;
    if (month === 'skip') {
        monthValue = 'skip';
    } else if (month && /^([1-9]|1[0-2])$/.test(month)) {
        monthValue = Number(month);
    }

    return {
        who: who && WHO_VALUES.has(who) ? (who as WhoValue) : null,
        age: age && AGE_VALUES.has(age) ? (age as AgeValue) : null,
        month: monthValue,
        days: days && DAYS_VALUES.has(days) ? (days as DaysValue) : null,
        thrill:
            thrill && THRILL_VALUES.has(thrill)
                ? (thrill as ThrillValue)
                : null,
        activity:
            activity && ACTIVITY_VALUES.has(activity)
                ? (activity as ActivityValue)
                : null,
    };
}

const QUESTION_ORDER: readonly QuestionId[] = [
    'who',
    'age',
    'activity',
    'month',
    'days',
    'thrill',
];

/** Top-level progress steps; the age follow-up shares `who`'s slot. */
const TOP_LEVEL_STEPS: readonly QuestionId[] = [
    'who',
    'activity',
    'month',
    'days',
    'thrill',
];

/** The age follow-up only applies to family trips, and the whitewater
    question only when the trip involves a raft — a biker never gets
    asked how much whitewater they want. */
function isApplicable(id: QuestionId, answers: TripFinderAnswers): boolean {
    if (id === 'age') return answers.who === 'kids';
    if (id === 'thrill') return answers.activity !== 'bike';
    return true;
}

/** Top-level steps applicable to this visitor's path (4 for bikers). */
function applicableSteps(answers: TripFinderAnswers): QuestionId[] {
    return TOP_LEVEL_STEPS.filter((id) => isApplicable(id, answers));
}

/** Honest mile-marker position: which applicable step a question is, and
    how many there are on this path. The age follow-up reports who's slot. */
export function stepInfo(
    answers: TripFinderAnswers,
    id: QuestionId,
): { number: number; total: number } {
    const steps = applicableSteps(answers);
    const slot = id === 'age' ? 'who' : id;
    return { number: steps.indexOf(slot) + 1, total: steps.length };
}

/** First unanswered applicable question, or 'results' once none remain. */
export function currentStep(
    answers: TripFinderAnswers,
): QuestionId | 'results' {
    for (const id of QUESTION_ORDER) {
        if (isApplicable(id, answers) && answers[id] === null) return id;
    }
    return 'results';
}

/**
 * Query string for a set of answers, in canonical order. Overrides add an
 * answer (option links), and a null override drops one (Back links, the
 * results screen's edit chips). Dropping `who` also drops `age` — an age
 * band is meaningless without the family context.
 */
export function answersToParams(
    answers: TripFinderAnswers,
    overrides: Partial<Record<QuestionId, string | null>> = {},
): string {
    const params = new URLSearchParams();
    for (const id of QUESTION_ORDER) {
        let value: string | null;
        if (id in overrides) {
            value = overrides[id] ?? null;
        } else {
            const answer = answers[id];
            value = answer === null ? null : String(answer);
        }
        if (
            id === 'age' &&
            (overrides.who === null ||
                (!('who' in overrides) && answers.who === null))
        ) {
            continue;
        }
        if (value !== null) params.set(id, value);
    }
    return params.toString();
}

/** The last answered question — target of the wizard's Back link. */
export function lastAnsweredQuestion(
    answers: TripFinderAnswers,
): QuestionId | null {
    for (let i = QUESTION_ORDER.length - 1; i >= 0; i--) {
        const id = QUESTION_ORDER[i];
        if (isApplicable(id, answers) && answers[id] !== null) return id;
    }
    return null;
}

/**
 * Fully completed progress steps (of TOTAL_STEPS). Step 1 counts only once
 * the age follow-up is also resolved — honest progress, per NN/g: the
 * current step renders as in-progress, never pre-filled.
 */
export function completedStepCount(answers: TripFinderAnswers): number {
    return applicableSteps(answers).filter((id) => {
        if (id === 'who') {
            return (
                answers.who !== null &&
                (answers.who !== 'kids' || answers.age !== null)
            );
        }
        return answers[id] !== null;
    }).length;
}

/** Questions answered with a real preference (skips carry no signal). */
export function answeredQuestionCount(answers: TripFinderAnswers): number {
    return QUESTION_ORDER.filter(
        (id) => answers[id] !== null && answers[id] !== 'skip',
    ).length;
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

/** Youngest possible guest per age band — the value a minimum age must
    clear. Lower bounds, so a band never sneaks past a real age limit. */
const AGE_BAND_FLOOR: Record<Exclude<AgeValue, 'skip'>, number> = {
    u5: 0,
    '5-7': 5,
    '8-12': 8,
    teens: 13,
};

const THRILL_TARGET_CLASS: Record<Exclude<ThrillValue, 'skip'>, number> = {
    mellow: 1.5,
    splash: 3,
    big: 4.5,
};

const DAYS_BAND_CENTER: Record<Exclude<DaysValue, 'skip'>, number> = {
    short: 3,
    classic: 5,
    epic: 7,
};

/** Question weights, per ARTA's stated choose-a-trip hierarchy (thrill and
    who-can-come first, then length, timing, and activity). */
const WEIGHTS: Record<
    'thrill' | 'age' | 'days' | 'month' | 'activity',
    number
> = {
    thrill: 3,
    age: 3,
    days: 2,
    month: 2,
    activity: 2,
};

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
}

interface ScorerResult {
    score: number;
    unknown: boolean;
    reason?: string;
    caveat?: string;
}

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

const UNKNOWN: ScorerResult = { score: 0.5, unknown: true };

function scoreThrill(
    trip: TripFinderTrip,
    thrill: Exclude<ThrillValue, 'skip'>,
): ScorerResult {
    const rapidClass = trip.maxRapidClass;
    if (rapidClass == null) return UNKNOWN;
    const target = THRILL_TARGET_CLASS[thrill];
    let score = clamp01(1 - Math.abs(target - rapidClass) / 3);
    let craftDial = false;
    const crafts = trip.craftTypes ?? [];
    if (crafts.length >= 2 && crafts.includes('inflatable-kayak')) {
        score = Math.min(1, score + 0.15);
        craftDial = true;
    }
    const reasons: Record<Exclude<ThrillValue, 'skip'>, string> = {
        mellow: 'Mostly calm water — scenery over adrenaline',
        splash: `Fun Class ${rapidClass} rapids — wet and laughing`,
        big: `Class ${rapidClass} whitewater — the real deal`,
    };
    let reason: string | undefined =
        score >= 0.75 ? reasons[thrill] : undefined;
    if (craftDial && reason) {
        reason +=
            ' — and you choose your ride, oar boat (mellow) to inflatable kayak (max splash)';
    }
    return { score, unknown: false, reason };
}

function scoreAge(
    trip: TripFinderTrip,
    age: Exclude<AgeValue, 'skip'>,
    month: number | null,
): ScorerResult {
    const minAge = effectiveMinAge(trip, month);
    if (minAge === null) return UNKNOWN;
    const floor = AGE_BAND_FLOOR[age];
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

function scoreDays(
    trip: TripFinderTrip,
    days: Exclude<DaysValue, 'skip'>,
): ScorerResult {
    const duration = trip.duration;
    if (duration == null) return UNKNOWN;
    const center = DAYS_BAND_CENTER[days];
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
        score: adjacent ? 0.4 : 0,
        unknown: false,
        caveat: adjacent
            ? `Season ends just before ${MONTH_NAMES[month - 1]} — dates nearby may work`
            : `Doesn't run in ${MONTH_NAMES[month - 1]}`,
    };
}

function scoreActivity(
    trip: TripFinderTrip,
    activity: Exclude<ActivityValue, 'skip'>,
): ScorerResult {
    const slugs = (trip.activities ?? [])
        .map((a) => a.slug?.current)
        .filter((slug): slug is string => Boolean(slug));
    if (slugs.length === 0) return UNKNOWN;
    const hasRaft = slugs.includes('rafting');
    const hasBike = slugs.includes('biking');
    if (activity === 'both') {
        return hasRaft && hasBike
            ? {
                  score: 1,
                  unknown: false,
                  reason: 'Paddle and pedal in one trip',
              }
            : { score: 0.5, unknown: false };
    }
    const wanted = activity === 'raft' ? hasRaft : hasBike;
    if (wanted) {
        return {
            score: 1,
            unknown: false,
            reason:
                activity === 'raft'
                    ? 'A river trip through and through'
                    : 'Singletrack and slickrock by mountain bike',
        };
    }
    // Mismatch scores low, never zero — score, don't hard-filter.
    return { score: 0.2, unknown: false };
}

/**
 * Ranks trips against the answers. Trips whose minimum age the youngest
 * guest fails sort below every clean fit regardless of score.
 */
export function scoreTrips(
    trips: readonly TripFinderTrip[],
    answers: TripFinderAnswers,
): TripMatch[] {
    const month = typeof answers.month === 'number' ? answers.month : null;

    const matches = trips.map((trip): TripMatch => {
        const weighted: {
            weight: number;
            result: ScorerResult;
        }[] = [];

        if (answers.thrill && answers.thrill !== 'skip') {
            weighted.push({
                weight: WEIGHTS.thrill,
                result: scoreThrill(trip, answers.thrill),
            });
        }
        let ageResult: ScorerResult | null = null;
        if (answers.who === 'kids' && answers.age && answers.age !== 'skip') {
            ageResult = scoreAge(trip, answers.age, month);
            weighted.push({ weight: WEIGHTS.age, result: ageResult });
        }
        if (answers.days && answers.days !== 'skip') {
            weighted.push({
                weight: WEIGHTS.days,
                result: scoreDays(trip, answers.days),
            });
        }
        if (month !== null) {
            weighted.push({
                weight: WEIGHTS.month,
                result: scoreMonth(trip, month),
            });
        }
        if (answers.activity && answers.activity !== 'skip') {
            weighted.push({
                weight: WEIGHTS.activity,
                result: scoreActivity(trip, answers.activity),
            });
        }

        const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
        const score =
            totalWeight === 0
                ? 0.5
                : weighted.reduce(
                      (sum, w) => sum + w.weight * w.result.score,
                      0,
                  ) / totalWeight;

        const reasons = weighted
            .filter((w) => w.result.reason)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 3)
            .map((w) => w.result.reason as string);

        const caveats = weighted
            .filter((w) => w.result.caveat)
            .map((w) => w.result.caveat as string);

        return {
            trip,
            score,
            reasons,
            caveats,
            ageConflict:
                ageResult !== null &&
                !ageResult.unknown &&
                ageResult.score === 0,
            unknownCount: weighted.filter((w) => w.result.unknown).length,
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

/** Below this, the "best match" isn't one — lead with the call-us fallback. */
export const MIN_CONFIDENT_SCORE = 0.35;

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
