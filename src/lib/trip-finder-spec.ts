import { z } from 'zod';
import { getTripFinderSpec, imageUrl } from '@/lib/sanity';
import {
    DEFAULT_TRIP_FINDER_SPEC,
    DEFAULT_TUNING,
    QUESTION_KINDS,
    type QuestionKind,
    type QuestionOption,
    type TripFinderQuestion,
    type TripFinderSpec,
} from '@/lib/trip-finder';
import type { TripFinderSpecQueryResult } from '@/sanity/types';

/**
 * The boundary between the Sanity "Trip Finder" document and the wizard.
 * Editor-authored content drives URL parsing and scoring here, so it gets
 * the untrusted-boundary posture of demo-flags.ts and the Arctic types:
 * validate the whole document, and on any failure fall back to the in-code
 * default rather than render a half-configured wizard. The Studio's own
 * validation should catch all of this first; this is the backstop.
 */

const kindSchema = z.enum(QUESTION_KINDS as [QuestionKind, ...QuestionKind[]]);

const conditionSchema = z.object({
    question: kindSchema,
    answer: z.string().min(1),
});

const optionSchema = z.object({
    label: z.string().min(1),
    value: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .refine((v) => v !== 'skip', 'skip is reserved'),
    sublabel: z.string().nullish(),
    bikeSublabel: z.string().nullish(),
    targetClass: z.number().min(1).max(5).nullish(),
    floorAge: z.number().min(0).nullish(),
    centerDays: z.number().min(1).nullish(),
    month: z.number().int().min(1).max(12).nullish(),
    tripTypeSlug: z.string().min(1).nullish(),
});

/** The dial each kind's answers must carry. */
const DIAL_FOR: Record<
    Exclude<QuestionKind, 'who'>,
    keyof z.infer<typeof optionSchema>
> = {
    thrill: 'targetClass',
    age: 'floorAge',
    days: 'centerDays',
    month: 'month',
    activity: 'tripTypeSlug',
};

const questionSchema = z
    .object({
        kind: kindSchema,
        title: z.string().min(1),
        subline: z.string().nullish(),
        shortLabel: z.string().min(1),
        skipLabel: z.string().min(1),
        ethos: z.string().nullish(),
        weight: z.number().min(1).max(5).nullish(),
        // Loose: keep hotspot/crop so imageUrl() can honour them.
        image: z.looseObject({
            asset: z.looseObject({ _ref: z.string().min(1) }),
            alt: z.string().min(1),
        }),
        onlyWhen: conditionSchema.nullish(),
        skipWhen: conditionSchema.nullish(),
        options: z.array(optionSchema).min(1),
    })
    .superRefine((question, ctx) => {
        const values = question.options.map((o) => o.value);
        if (new Set(values).size !== values.length) {
            ctx.addIssue({
                code: 'custom',
                message: `Duplicate answer values on the ${question.kind} question`,
            });
        }
        if (question.kind === 'who') return;
        const dial = DIAL_FOR[question.kind];
        question.options.forEach((option, index) => {
            if (option[dial] == null) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['options', index, dial],
                    message: `Every ${question.kind} answer needs ${dial}`,
                });
            }
        });
    });

const specSchema = z.object({
    minConfidentScore: z.number().min(0).max(1).nullish(),
    resultsShown: z.number().int().min(1).max(6).nullish(),
    questions: z
        .array(questionSchema)
        .min(1)
        .refine(
            (qs) => new Set(qs.map((q) => q.kind)).size === qs.length,
            'One question per kind',
        ),
});

type ValidSpec = z.infer<typeof specSchema>;

function normalizeOption(
    raw: ValidSpec['questions'][number]['options'][number],
): QuestionOption {
    return {
        value: raw.value,
        label: raw.label,
        sublabel: raw.sublabel ?? undefined,
        bikeSublabel: raw.bikeSublabel ?? undefined,
        targetClass: raw.targetClass ?? undefined,
        floorAge: raw.floorAge ?? undefined,
        centerDays: raw.centerDays ?? undefined,
        month: raw.month ?? undefined,
        tripTypeSlug: raw.tripTypeSlug ?? undefined,
    };
}

function normalizeQuestion(
    raw: ValidSpec['questions'][number],
): TripFinderQuestion {
    return {
        id: raw.kind,
        title: raw.title,
        subline: raw.subline ?? undefined,
        shortLabel: raw.shortLabel,
        skipLabel: raw.skipLabel,
        ethos: raw.ethos ?? undefined,
        image: imageUrl(raw.image, 1920, 1080),
        imageAlt: raw.image.alt,
        weight: raw.kind === 'who' ? 0 : (raw.weight ?? 2),
        onlyWhen: raw.onlyWhen ?? undefined,
        skipWhen: raw.skipWhen ?? undefined,
        options: raw.options.map(normalizeOption),
    };
}

/** Pure: a fetched document → a usable spec, or null with the reason. */
export function normalizeTripFinderSpec(
    raw: TripFinderSpecQueryResult,
):
    | { spec: TripFinderSpec; error?: undefined }
    | { spec?: undefined; error: string } {
    if (raw === null) return { error: 'No Trip Finder document published' };
    const parsed = specSchema.safeParse(raw);
    if (!parsed.success) {
        return { error: z.prettifyError(parsed.error) };
    }
    return {
        spec: {
            source: 'sanity',
            questions: parsed.data.questions.map(normalizeQuestion),
            tuning: {
                minConfidentScore:
                    parsed.data.minConfidentScore ??
                    DEFAULT_TUNING.minConfidentScore,
                resultsShown:
                    parsed.data.resultsShown ?? DEFAULT_TUNING.resultsShown,
            },
        },
    };
}

/** The live spec, or the in-code default when Sanity has nothing usable.
    Never throws — the wizard must render whatever the Studio holds. */
export async function resolveTripFinderSpec(): Promise<TripFinderSpec> {
    try {
        const result = normalizeTripFinderSpec(await getTripFinderSpec());
        if (result.spec) return result.spec;
        console.warn(`[trip-finder] using fallback questions: ${result.error}`);
    } catch (error) {
        console.warn('[trip-finder] using fallback questions:', error);
    }
    return DEFAULT_TRIP_FINDER_SPEC;
}
