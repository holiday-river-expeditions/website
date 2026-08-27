import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { TripCard } from '@/components/ui/TripCard';
import { imageUrl } from '@/lib/sanity';
import {
    answerLabel,
    answersToParams,
    MIN_CONFIDENT_SCORE,
    TRIP_FINDER_QUESTIONS,
    type QuestionId,
    type TripFinderAnswers,
    type TripMatch,
} from '@/lib/trip-finder';

/** Next open departure for a matched trip, resolved by the page. */
export interface ResultAvailability {
    /** e.g. "Aug 10 – Aug 15" */
    dateLabel: string;
    remaining: number | null;
    /** Deep link into /book, month-filtered and anchored to the trip. */
    bookHref: string;
}

interface TripFinderResultsProps {
    matches: TripMatch[];
    answers: TripFinderAnswers;
    availabilityBySlug: ReadonlyMap<string, ResultAvailability>;
    /** Arctic was unreachable — cards render without dates, phone leads. */
    arcticDown: boolean;
}

const CALL_LINE = (
    <>
        Call{' '}
        <a
            href='tel:+18012662087'
            className='font-bold text-holiday-red transition-opacity hover:opacity-70'
        >
            801-266-2087
        </a>{' '}
        — we&rsquo;ve been matching people to rivers since 1966.
    </>
);

function cardProps(match: TripMatch) {
    const { trip } = match;
    return {
        name: trip.name ?? 'Trip',
        category: trip.category ?? 'River Trip',
        image: imageUrl(trip.image, 720, 706),
        startingPrice: trip.startingPrice ?? '',
        duration:
            trip.durationLabel ??
            (trip.duration ? `${trip.duration} Days` : ''),
        href: `/trips/${trip.slug?.current ?? ''}`,
        subtitle: trip.subtitle ?? undefined,
        river: trip.river?.name ?? undefined,
    };
}

/**
 * The wizard's results: one best match with the reasons it fits, two
 * alternates, editable answer chips (drop one answer, land back on exactly
 * that question), and a human fallback that never disappears.
 */
export function TripFinderResults({
    matches,
    answers,
    availabilityBySlug,
    arcticDown,
}: TripFinderResultsProps) {
    const [best, ...alternates] = matches;
    const confident =
        best !== undefined &&
        best.score >= MIN_CONFIDENT_SCORE &&
        !best.ageConflict;

    const answeredChips = TRIP_FINDER_QUESTIONS.filter(
        (q) =>
            answers[q.id] !== null &&
            (q.id !== 'age' || answers.who === 'kids'),
    );

    return (
        <>
            <Section background='sand' className='pb-8 pt-14 md:pt-20'>
                <p className='font-alt-gothic text-subheading font-semibold uppercase tracking-wide text-teal'>
                    Find Your Trip
                </p>
                <h1 className='mt-2 font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    {confident
                        ? 'Your river is calling'
                        : 'Let’s narrow it down'}
                </h1>
                {!confident && (
                    <p className='mt-4 max-w-2xl text-paragraph leading-paragraph text-onyx'>
                        Nothing lines up perfectly with every answer, so here
                        are the closest fits — and a shortcut: {CALL_LINE}
                    </p>
                )}

                {/* Your answers, each editable in place. */}
                <ul className='mt-6 flex flex-wrap gap-2'>
                    {answeredChips.map((question) => (
                        <li key={question.id}>
                            <Link
                                href={`/trip-finder?${answersToParams(answers, {
                                    [question.id]: null,
                                })}`}
                                className='inline-block border border-onyx/40 bg-holiday-white px-3.5 py-1.5 text-[14px] font-bold leading-tight text-onyx transition-colors hover:border-holiday-red hover:text-holiday-red'
                            >
                                {question.shortLabel}:{' '}
                                {answerLabel(
                                    question.id as QuestionId,
                                    answers[question.id] as string | number,
                                )}{' '}
                                <span aria-hidden='true'>&times;</span>
                                <span className='sr-only'>
                                    {' '}
                                    (change this answer)
                                </span>
                            </Link>
                        </li>
                    ))}
                    <li>
                        <Link
                            href='/trip-finder'
                            className='inline-block px-3.5 py-1.5 text-[14px] font-bold leading-tight text-teal underline underline-offset-4 transition-opacity hover:opacity-70'
                        >
                            Start over
                        </Link>
                    </li>
                </ul>
            </Section>

            {best && (
                <Section background='white' className='py-12 md:py-16'>
                    <h2 className='font-alt-gothic text-section font-black uppercase text-onyx'>
                        {confident ? 'Best Match' : 'Closest Fit'}
                    </h2>
                    <div className='mt-6 grid gap-10 md:grid-cols-2'>
                        <TripCard
                            {...cardProps(best)}
                            ribbon='Best Match'
                            featured
                        />
                        <div>
                            <h3 className='font-alt-gothic text-subheading font-bold uppercase text-onyx'>
                                Why it fits
                            </h3>
                            {best.reasons.length > 0 ? (
                                <ul className='mt-3 space-y-2'>
                                    {best.reasons.map((reason) => (
                                        <li
                                            key={reason}
                                            className='flex gap-3 text-paragraph leading-paragraph text-onyx'
                                        >
                                            <span
                                                aria-hidden='true'
                                                className='font-bold text-holiday-red'
                                            >
                                                &#10003;
                                            </span>
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className='mt-3 text-paragraph leading-paragraph text-onyx'>
                                    A solid all-around pick from what you told
                                    us.
                                </p>
                            )}
                            {best.caveats.map((caveat) => (
                                <p
                                    key={caveat}
                                    className='mt-3 border-l-4 border-sand pl-3 text-body leading-body text-onyx/80'
                                >
                                    {caveat}
                                </p>
                            ))}
                            {(() => {
                                const slug = best.trip.slug?.current;
                                const availability = slug
                                    ? availabilityBySlug.get(slug)
                                    : undefined;
                                if (availability) {
                                    return (
                                        <div className='mt-6'>
                                            <p className='text-body leading-body text-onyx'>
                                                Next open date:{' '}
                                                <span className='font-bold'>
                                                    {availability.dateLabel}
                                                </span>
                                                {availability.remaining !==
                                                    null && (
                                                    <>
                                                        {' '}
                                                        &middot;{' '}
                                                        {
                                                            availability.remaining
                                                        }{' '}
                                                        {availability.remaining ===
                                                        1
                                                            ? 'seat'
                                                            : 'seats'}{' '}
                                                        left
                                                    </>
                                                )}
                                            </p>
                                            <Button
                                                href={availability.bookHref}
                                                className='mt-3'
                                            >
                                                See Dates &amp; Book
                                            </Button>
                                        </div>
                                    );
                                }
                                return (
                                    <p className='mt-6 text-body leading-body text-onyx'>
                                        {arcticDown
                                            ? 'Live availability is napping. '
                                            : 'No open online dates right now. '}
                                        {CALL_LINE}
                                    </p>
                                );
                            })()}
                        </div>
                    </div>
                </Section>
            )}

            {alternates.length > 0 && (
                <Section background='white' className='pb-16 pt-0'>
                    <h2 className='font-alt-gothic text-section font-black uppercase text-onyx'>
                        Also Worth a Look
                    </h2>
                    <div className='mt-6 grid gap-10 sm:grid-cols-2 lg:max-w-4xl'>
                        {alternates.map((match) => (
                            <div key={match.trip._id}>
                                <TripCard {...cardProps(match)} />
                                {match.reasons.slice(0, 2).map((reason) => (
                                    <p
                                        key={reason}
                                        className='mt-2 text-body leading-body text-onyx/80'
                                    >
                                        <span
                                            aria-hidden='true'
                                            className='font-bold text-holiday-red'
                                        >
                                            &#10003;{' '}
                                        </span>
                                        {reason}
                                    </p>
                                ))}
                                {match.caveats.slice(0, 1).map((caveat) => (
                                    <p
                                        key={caveat}
                                        className='mt-2 border-l-4 border-sand pl-3 text-body leading-body text-onyx/70'
                                    >
                                        {caveat}
                                    </p>
                                ))}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            <Section background='evergreen' className='py-12'>
                <p className='max-w-2xl text-paragraph leading-paragraph'>
                    Still not sure? Call{' '}
                    <a
                        href='tel:+18012662087'
                        className='font-bold underline underline-offset-4 transition-opacity hover:opacity-70'
                    >
                        801-266-2087
                    </a>{' '}
                    — we&rsquo;ve been matching people to rivers since 1966.
                </p>
            </Section>
        </>
    );
}
