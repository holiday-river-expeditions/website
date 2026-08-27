import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import {
    answersToParams,
    currentStep,
    lastAnsweredQuestion,
    TOTAL_STEPS,
    TRIP_FINDER_QUESTIONS,
    type TripFinderAnswers,
} from '@/lib/trip-finder';

/**
 * One wizard question, fully server-rendered. Every option is a real link
 * that adds one query param — the URL is the whole state, so answers are
 * shareable, the browser Back button just works, and nothing here needs
 * JavaScript.
 */
export function TripFinderWizard({ answers }: { answers: TripFinderAnswers }) {
    const step = currentStep(answers);
    const question = TRIP_FINDER_QUESTIONS.find((q) => q.id === step);
    if (!question) return null;

    const back = lastAnsweredQuestion(answers);
    const backHref =
        back === null
            ? null
            : `/trip-finder?${answersToParams(answers, { [back]: null })}`;

    return (
        <Section background='sand' className='py-20 md:py-28'>
            <div className='mx-auto max-w-3xl' data-reveal>
                <p className='font-alt-gothic text-subheading font-semibold uppercase tracking-wide text-teal'>
                    Find Your Trip
                </p>

                {/* Progress: five dots, one per top-level question. */}
                <div
                    className='mt-4 flex items-center gap-3'
                    aria-label={`Question ${question.step} of ${TOTAL_STEPS}`}
                >
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <span
                            key={i}
                            aria-hidden='true'
                            className={`h-2.5 w-2.5 rounded-full ${
                                i < question.step
                                    ? 'bg-holiday-red'
                                    : 'bg-onyx/20'
                            }`}
                        />
                    ))}
                    <span className='ml-1 text-body leading-body text-onyx/70'>
                        Question {question.step} of {TOTAL_STEPS}
                    </span>
                </div>

                <h1 className='mt-5 font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    {question.title}
                </h1>

                <ul className='mt-8 grid gap-4 sm:grid-cols-2'>
                    {question.options.map((option) => (
                        <li key={option.value}>
                            <Link
                                href={`/trip-finder?${answersToParams(answers, {
                                    [question.id]: option.value,
                                })}`}
                                className='block border-2 border-onyx/25 bg-holiday-white px-6 py-5 transition-colors hover:border-holiday-red focus-visible:border-holiday-red'
                            >
                                <span className='block font-alt-gothic text-subheading font-bold uppercase leading-tight text-onyx'>
                                    {option.label}
                                </span>
                                {option.sublabel && (
                                    <span className='mt-1 block text-body leading-body text-onyx/70'>
                                        {option.sublabel}
                                    </span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className='mt-8 flex items-center justify-between text-body leading-body'>
                    {backHref ? (
                        <Link
                            href={backHref}
                            className='font-bold text-onyx/70 transition-opacity hover:opacity-70'
                        >
                            &larr; Back
                        </Link>
                    ) : (
                        <span />
                    )}
                    <Link
                        href={`/trip-finder?${answersToParams(answers, {
                            [question.id]: 'skip',
                        })}`}
                        className='font-bold text-teal underline underline-offset-4 transition-opacity hover:opacity-70'
                    >
                        {question.skipLabel}
                    </Link>
                </div>
            </div>
        </Section>
    );
}
