import Image from 'next/image';
import Link from 'next/link';
import {
    answersToParams,
    answerLabel,
    completedStepCount,
    currentStep,
    lastAnsweredQuestion,
    TOTAL_STEPS,
    TRIP_FINDER_QUESTIONS,
    type QuestionId,
    type TripFinderAnswers,
} from '@/lib/trip-finder';

/**
 * One wizard question as a full-screen scene: full-bleed photography under
 * an evergreen scrim, options as white cards with a rising teal waterline,
 * and a river-course progress line instead of dots. Fully server-rendered —
 * every option is a real link that adds one query param, so the URL is the
 * whole state: shareable, back-button-native, works without JavaScript.
 *
 * Contrast rule (axe can't see text over photos): every text block sits on
 * the evergreen scrim at >=60% opacity or on a white card — never on raw
 * photograph.
 */

/** Marker coordinates along RIVER_PATH, put-in to take-out. */
const RIVER_PATH = 'M2 14 C 18 4, 30 22, 46 12 S 76 4, 92 14 S 112 20, 118 10';
const RIVER_MARKS: [number, number][] = [
    [2, 14],
    [31, 15],
    [60, 9],
    [89, 13],
    [118, 10],
];

function RiverProgress({
    completed,
    current,
}: {
    completed: number;
    current: number;
}) {
    return (
        <svg viewBox='-2 0 124 24' className='w-40 md:w-48' aria-hidden='true'>
            <path
                d={RIVER_PATH}
                fill='none'
                stroke='#fcfcfc'
                strokeOpacity='0.3'
                strokeWidth='2.5'
                strokeLinecap='round'
            />
            <path
                d={RIVER_PATH}
                fill='none'
                stroke='#9dbdb8'
                strokeWidth='2.5'
                strokeLinecap='round'
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - completed / TOTAL_STEPS}
            />
            {RIVER_MARKS.map(([x, y], i) => {
                const step = i + 1;
                if (step === current) {
                    // Current position: the boat — a white ring still open.
                    return (
                        <circle
                            key={step}
                            cx={x}
                            cy={y}
                            r='4'
                            fill='#0a332d'
                            stroke='#fcfcfc'
                            strokeWidth='2'
                        />
                    );
                }
                return (
                    <circle
                        key={step}
                        cx={x}
                        cy={y}
                        r='3'
                        fill={step <= completed ? '#9dbdb8' : 'none'}
                        stroke='#fcfcfc'
                        strokeOpacity={step <= completed ? '0' : '0.4'}
                        strokeWidth='1.5'
                    />
                );
            })}
        </svg>
    );
}

export function TripFinderWizard({ answers }: { answers: TripFinderAnswers }) {
    const step = currentStep(answers);
    const question = TRIP_FINDER_QUESTIONS.find((q) => q.id === step);
    if (!question) return null;

    const completed = completedStepCount(answers);
    const isFollowUp = question.id === 'age';
    const isFinal = question.step === TOTAL_STEPS;

    const back = lastAnsweredQuestion(answers);
    const backHref =
        back === null
            ? null
            : `/trip-finder?${answersToParams(answers, { [back]: null })}`;

    // The running trip log: answers so far, visible proof each tap landed
    // (the follow-up screen keeps the same mile marker, so this is the
    // feedback that "Bringing kids" registered).
    const logged = TRIP_FINDER_QUESTIONS.filter(
        (q) =>
            answers[q.id] !== null &&
            (q.id !== 'age' || answers.who === 'kids'),
    );

    return (
        // key remounts the scene per step so entrance animations replay
        // across client-side navigations.
        // Height subtracts the site header's approximate height so the
        // bottom-anchored options (and Skip/Back above them) land inside the
        // first viewport on phones — the wizard must never hide its exits
        // below the fold.
        <div
            key={question.id}
            className='relative flex min-h-[calc(100svh-84px)] flex-col md:min-h-[calc(100svh-96px)]'
        >
            {/* Backdrop: photo + scrim in their own layer (evergreen base
                keeps text legible before the photo paints). Positioned
                content below stacks above it. */}
            <div className='absolute inset-0 overflow-hidden bg-evergreen'>
                <Image
                    src={question.image}
                    alt={question.imageAlt}
                    fill
                    priority
                    sizes='100vw'
                    className='object-cover'
                />
                {/* Scrim: readable top band + solid footing for options. */}
                <div
                    aria-hidden='true'
                    className='absolute inset-0 bg-gradient-to-b from-evergreen/80 via-evergreen/35 to-evergreen/90'
                />
            </div>

            {/* Header: eyebrow + honest river progress + trip log */}
            <header className='relative px-6 pt-5 md:px-10'>
                <div className='mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2'>
                    <p className='font-alt-gothic text-subheading font-bold uppercase tracking-wide text-holiday-white'>
                        Find Your Trip
                    </p>
                    <div className='flex items-center gap-3'>
                        <RiverProgress
                            completed={completed}
                            current={question.step}
                        />
                        <p className='text-[15px] font-bold leading-tight text-holiday-white'>
                            Mile {question.step} of {TOTAL_STEPS}
                            {isFollowUp && (
                                <span className='font-normal text-holiday-white/80'>
                                    {' '}
                                    &middot; quick follow-up
                                </span>
                            )}
                            <span className='sr-only'>
                                {' '}
                                (question {question.step} of {TOTAL_STEPS})
                            </span>
                        </p>
                    </div>
                </div>
                {logged.length > 0 && (
                    <ul className='mx-auto mt-3 flex w-full max-w-5xl flex-wrap gap-2'>
                        {logged.map((q) => (
                            <li
                                key={q.id}
                                className='border border-holiday-white/35 px-2.5 py-1 text-[13px] font-bold leading-tight text-holiday-white'
                            >
                                <span
                                    aria-hidden='true'
                                    className='mr-1 text-opal'
                                >
                                    &#10003;
                                </span>
                                {q.shortLabel}:{' '}
                                {answerLabel(
                                    q.id as QuestionId,
                                    answers[q.id] as string | number,
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            {/* Question + options, pinned low for thumb reach */}
            <div className='relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-end px-6 pb-4 pt-10 md:px-10'>
                <h1 className='font-alt-gothic text-h3 font-black uppercase leading-none text-holiday-white [text-shadow:0_2px_18px_rgba(10,51,45,0.55)] sm:text-h2 sm:leading-h2 md:text-h1 md:leading-h1 motion-safe:animate-finder-rise'>
                    {question.title}
                </h1>
                {(question.subline || isFinal) && (
                    <p className='mt-2 text-paragraph font-bold leading-paragraph text-opal motion-safe:animate-finder-rise motion-safe:[animation-delay:0.08s]'>
                        {question.subline ?? "Last one — takeout's in sight."}
                    </p>
                )}

                {/* Back + Skip live above the options so they are inside the
                    first viewport on every screen, including 7-option month. */}
                <div className='mt-3 flex items-center gap-6 text-body leading-body motion-safe:animate-finder-rise motion-safe:[animation-delay:0.12s]'>
                    {backHref && (
                        <Link
                            href={backHref}
                            className='flex min-h-11 items-center font-bold text-holiday-white/85 transition-opacity hover:opacity-70'
                        >
                            &larr; Back
                        </Link>
                    )}
                    <Link
                        href={`/trip-finder?${answersToParams(answers, {
                            [question.id]: 'skip',
                        })}`}
                        className='flex min-h-11 items-center font-bold text-holiday-white underline decoration-opal decoration-2 underline-offset-4 transition-opacity hover:opacity-70'
                    >
                        {question.skipLabel}
                    </Link>
                </div>

                <ul
                    className={`mt-4 grid gap-3 motion-safe:animate-finder-rise motion-safe:[animation-delay:0.16s] ${
                        question.options.length > 4
                            ? 'grid-cols-2 lg:grid-cols-4'
                            : 'sm:grid-cols-2 lg:grid-cols-3'
                    }`}
                >
                    {question.options.map((option) => (
                        <li key={option.value}>
                            <Link
                                href={`/trip-finder?${answersToParams(answers, {
                                    [question.id]: option.value,
                                })}`}
                                className='water-fill group block min-h-[64px] bg-holiday-white/95 px-4 py-3.5 transition-transform active:scale-[0.98] md:px-5 md:py-4'
                            >
                                <span className='block font-alt-gothic text-subheading font-bold uppercase leading-tight text-onyx transition-colors group-hover:text-holiday-white group-focus-visible:text-holiday-white group-active:text-holiday-white'>
                                    {option.label}
                                </span>
                                {option.sublabel && (
                                    <span className='mt-0.5 block text-[14px] leading-snug text-onyx/75 transition-colors group-hover:text-holiday-white/90 group-focus-visible:text-holiday-white/90 group-active:text-holiday-white/90'>
                                        {option.sublabel}
                                    </span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Ethos footer */}
            <footer className='relative px-6 pb-5 md:px-10'>
                <p className='mx-auto w-full max-w-5xl text-[14px] font-bold uppercase tracking-[0.08em] text-holiday-white/80'>
                    {question.ethos}
                </p>
            </footer>
        </div>
    );
}
