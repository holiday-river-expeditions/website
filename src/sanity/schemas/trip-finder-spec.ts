import {
    defineArrayMember,
    defineField,
    defineType,
    type ConditionalPropertyCallbackContext,
    type NumberRule,
    type ReferenceRule,
    type Rule,
    type ValidationContext,
} from 'sanity';
import { MONTHS } from './trip';

/**
 * The Find Your Trip wizard's questions, answers, and dials — a singleton
 * Holiday edits directly. Copy, photos, order, weights, and what each answer
 * means to the matcher all live here; the arithmetic that turns a dial plus
 * a trip's facts into a score stays in src/lib/trip-finder.ts.
 *
 * `kind` is the one tie to code: it names which built-in matcher a question
 * feeds and doubles as the URL parameter, so shared links survive rewording.
 * One question per kind. A new kind needs new arithmetic and a new trip
 * field, so that is a developer change.
 *
 * The site keeps today's questions in code as a fallback: an empty or
 * invalid document never blanks the wizard.
 */

export const QUESTION_KINDS = [
    { title: "Who's coming", value: 'who' },
    { title: 'Youngest age', value: 'age' },
    { title: 'Rafting or biking', value: 'activity' },
    { title: 'Month', value: 'month' },
    { title: 'Trip length', value: 'days' },
    { title: 'Whitewater', value: 'thrill' },
] as const;

type QuestionKind = (typeof QUESTION_KINDS)[number]['value'];

const kindTitle = (kind: unknown) =>
    QUESTION_KINDS.find((k) => k.value === kind)?.title ?? 'Question';

/**
 * An answer's dial depends on the kind of the question that owns it, which
 * is two levels up — Sanity's callbacks only see the immediate parent. Walk
 * the document's questions for the one whose options hold this answer.
 */
function kindOfOption(
    context: Pick<
        ConditionalPropertyCallbackContext | ValidationContext,
        'document' | 'parent'
    >,
): QuestionKind | null {
    const parent = context.parent as { _key?: string } | undefined;
    const key = parent?._key;
    if (!key) return null;
    const questions = (
        context.document as
            | { questions?: { kind?: string; options?: { _key?: string }[] }[] }
            | undefined
    )?.questions;
    const owner = questions?.find((q) =>
        q.options?.some((o) => o._key === key),
    );
    const kind = owner?.kind;
    return QUESTION_KINDS.some((k) => k.value === kind)
        ? (kind as QuestionKind)
        : null;
}

/** A dial shows only on its kind's answers, and is required there. */
function dial<R extends NumberRule | ReferenceRule>(kind: QuestionKind) {
    return {
        hidden: (context: ConditionalPropertyCallbackContext) =>
            kindOfOption(context) !== kind,
        validation: (rule: R) =>
            (rule as Rule).custom((value, context) =>
                kindOfOption(context) === kind && value == null
                    ? `Every ${kindTitle(kind)} answer needs this.`
                    : true,
            ) as unknown as R,
    };
}

export const tripFinderCondition = defineType({
    name: 'tripFinderCondition',
    title: 'Condition',
    type: 'object',
    fields: [
        defineField({
            name: 'question',
            title: 'Question',
            type: 'string',
            options: { list: [...QUESTION_KINDS] },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'answer',
            title: 'Answer value',
            type: 'string',
            description:
                'The Value of the answer on that question, exactly as typed there — e.g. "kids".',
            validation: (rule) => rule.required(),
        }),
    ],
    preview: {
        select: { question: 'question', answer: 'answer' },
        prepare: ({ question, answer }) => ({
            title: `${kindTitle(question)} is "${answer ?? ''}"`,
        }),
    },
});

export const tripFinderOption = defineType({
    name: 'tripFinderOption',
    title: 'Answer',
    type: 'object',
    fields: [
        defineField({
            name: 'label',
            title: 'Button label',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'value',
            title: 'Value',
            type: 'string',
            description:
                'Short code that goes in the page address when this answer is picked, e.g. "splash". Lowercase letters, numbers, and dashes only. Changing it breaks links people have already shared.',
            validation: (rule) =>
                rule
                    .required()
                    .regex(/^[a-z0-9-]+$/, { name: 'url-safe' })
                    .custom((value) =>
                        value === 'skip'
                            ? '"skip" is reserved for the skip button.'
                            : true,
                    ),
        }),
        defineField({
            name: 'sublabel',
            title: 'Hint',
            type: 'string',
            description: 'Small line under the button label.',
        }),
        defineField({
            name: 'bikeSublabel',
            title: 'Hint when biking',
            type: 'string',
            description:
                'Shown instead of the hint once the visitor has picked biking — e.g. a month described by trail conditions rather than water. Leave empty to reuse the hint.',
        }),

        // --- Dials: one per kind, each visible only on its kind's answers ---
        defineField({
            name: 'targetClass',
            title: 'Target rapid class',
            type: 'number',
            description:
                'The whitewater this answer is asking for, on the I–V scale. Decimals are fine: "Mellow float" is 1.5, "Some splash" is 3, "Big whitewater" is 4.5. Trips score higher the closer their Max Rapid Class sits to this.',
            ...dial<NumberRule>('thrill'),
        }),
        defineField({
            name: 'floorAge',
            title: 'Youngest guest (years)',
            type: 'number',
            description:
                'The youngest a guest could be with this answer — the age a trip’s minimum must allow. "Under 5" is 0, "8–12" is 8, "Teens" is 13.',
            ...dial<NumberRule>('age'),
        }),
        defineField({
            name: 'centerDays',
            title: 'Ideal trip length (days)',
            type: 'number',
            description:
                'The number of days this answer is aiming for. "A long weekend" is 3, "The classic" is 5, "The full disconnect" is 7. Trips score higher the closer their Duration sits to this.',
            ...dial<NumberRule>('days'),
        }),
        defineField({
            name: 'month',
            title: 'Month',
            type: 'number',
            options: { list: MONTHS },
            description:
                'Which month this answer means. Matched against each trip’s Season (months).',
            ...dial<NumberRule>('month'),
        }),
        defineField({
            name: 'tripType',
            title: 'Trip Type',
            type: 'reference',
            to: [{ type: 'tripType' }],
            description:
                'The Trip Type this answer is asking for. Trips of this type score full marks; Combo trips score most of the way for either answer.',
            ...dial<ReferenceRule>('activity'),
        }),
    ],
    preview: {
        select: { title: 'label', subtitle: 'value' },
    },
});

export const tripFinderQuestion = defineType({
    name: 'tripFinderQuestion',
    title: 'Question',
    type: 'object',
    fields: [
        defineField({
            name: 'kind',
            title: 'Kind',
            type: 'string',
            options: { list: [...QUESTION_KINDS], layout: 'radio' },
            description:
                'Which built-in matcher this question feeds. Each kind can be used once. This is the only thing tying a question to code — everything else on this screen is yours to change.',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'title',
            title: 'Question',
            type: 'string',
            description:
                'The big line, e.g. "How much whitewater do you want?"',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'subline',
            title: 'Hint line',
            type: 'string',
            description: 'Optional reassurance under the question.',
        }),
        defineField({
            name: 'shortLabel',
            title: 'Short label',
            type: 'string',
            description:
                'One or two words used in the running trip log and the results chips, e.g. "Whitewater".',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'skipLabel',
            title: 'Skip button text',
            type: 'string',
            description:
                'e.g. "Not sure — skip". Every question can be skipped.',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'ethos',
            title: 'Ethos line',
            type: 'string',
            description:
                'One quiet brand line in the corner of the screen, e.g. "No motors. Ever."',
        }),
        defineField({
            name: 'image',
            title: 'Background photo',
            type: 'image',
            options: { hotspot: true },
            description:
                'Full-screen photo behind this question. Landscape, at least 3000px wide. Set the hotspot on the subject so phones crop well.',
            fields: [
                defineField({
                    name: 'alt',
                    title: 'Alt text',
                    type: 'string',
                    description: 'Describes the photo for screen readers.',
                    validation: (rule) => rule.required(),
                }),
            ],
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'weight',
            title: 'Weight',
            type: 'number',
            description:
                'How much this question counts toward the pick, 1 (least) to 5 (most). The whitewater and age questions weigh 3 today; the rest weigh 2.',
            initialValue: 2,
            hidden: ({ parent }) =>
                (parent as { kind?: string } | undefined)?.kind === 'who',
            validation: (rule) => rule.min(1).max(5),
        }),
        defineField({
            name: 'onlyWhen',
            title: 'Only ask when…',
            type: 'tripFinderCondition',
            description:
                'Leave empty to always ask. Set it to make this a follow-up — e.g. only ask the age question when Who’s coming is "kids". Follow-ups share their parent’s spot on the progress line.',
        }),
        defineField({
            name: 'skipWhen',
            title: 'Skip when…',
            type: 'tripFinderCondition',
            description:
                'Leave empty to always ask. Set it to drop the question for some visitors — e.g. skip the whitewater question when Rafting or biking is "bike".',
        }),
        defineField({
            name: 'options',
            title: 'Answers',
            type: 'array',
            of: [defineArrayMember({ type: 'tripFinderOption' })],
            description: 'The buttons, in order. Drag to reorder.',
            validation: (rule) =>
                rule
                    .required()
                    .min(1)
                    .custom((options) => {
                        const values = (options ?? []).map(
                            (o) => (o as { value?: string }).value,
                        );
                        const dupes = values.filter(
                            (v, i) => v && values.indexOf(v) !== i,
                        );
                        return dupes.length > 0
                            ? `Answer values must be unique — "${dupes[0]}" is used twice.`
                            : true;
                    }),
        }),
    ],
    preview: {
        select: { title: 'title', kind: 'kind', media: 'image' },
        prepare: ({ title, kind, media }) => ({
            title,
            subtitle: kindTitle(kind),
            media,
        }),
    },
});

export const tripFinderSpec = defineType({
    name: 'tripFinderSpec',
    title: 'Trip Finder',
    type: 'document',
    groups: [
        { name: 'questions', title: 'Questions', default: true },
        { name: 'tuning', title: 'Tuning' },
    ],
    fields: [
        defineField({
            name: 'questions',
            title: 'Questions',
            type: 'array',
            group: 'questions',
            of: [defineArrayMember({ type: 'tripFinderQuestion' })],
            description:
                'The wizard, in the order visitors see it. Drag to reorder. Remove a question and it simply isn’t asked.',
            validation: (rule) =>
                rule
                    .required()
                    .min(1)
                    .custom((questions) => {
                        const kinds = (questions ?? []).map(
                            (q) => (q as { kind?: string }).kind,
                        );
                        const dupe = kinds.find(
                            (k, i) => k && kinds.indexOf(k) !== i,
                        );
                        return dupe
                            ? `Only one ${kindTitle(dupe)} question is allowed.`
                            : true;
                    }),
        }),
        defineField({
            name: 'minConfidentScore',
            title: 'Best Match threshold',
            type: 'number',
            group: 'tuning',
            description:
                'Scores run from 0 to 1. Below this the results page stops claiming a "Best Match" and leads with a call-us line instead. 0.35 today.',
            initialValue: 0.35,
            validation: (rule) => rule.required().min(0).max(1),
        }),
        defineField({
            name: 'resultsShown',
            title: 'Results shown',
            type: 'number',
            group: 'tuning',
            description:
                'How many trips the results page shows: one best match plus this many minus one alternates. 3 today.',
            initialValue: 3,
            validation: (rule) => rule.required().integer().min(1).max(6),
        }),
    ],
    preview: {
        prepare: () => ({ title: 'Trip Finder' }),
    },
});
