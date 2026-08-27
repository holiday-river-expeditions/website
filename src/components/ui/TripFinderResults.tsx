import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { TripCard } from '@/components/ui/TripCard';
import { imageUrl } from '@/lib/sanity';
import {
    answerLabel,
    answeredQuestionCount,
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

/** Seat counts only add urgency when they're actually scarce. */
const SEAT_URGENCY_MAX = 10;

const CALL_LINE = (
    <>
        Call{' '}
        <a
            href='tel:+18012662087'
            className='font-bold underline underline-offset-4 transition-opacity hover:opacity-70'
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

function AvailabilityLine({
    availability,
    tone,
}: {
    availability: ResultAvailability | undefined;
    tone: 'light' | 'dark';
}) {
    if (!availability) return null;
    const scarce =
        availability.remaining !== null &&
        availability.remaining <= SEAT_URGENCY_MAX;
    return (
        <p
            className={`text-body leading-body ${
                tone === 'light' ? 'text-holiday-white' : 'text-onyx'
            }`}
        >
            Next open date:{' '}
            <span className='font-bold'>{availability.dateLabel}</span>
            {scarce && (
                <>
                    {' '}
                    &middot; only {availability.remaining}{' '}
                    {availability.remaining === 1 ? 'seat' : 'seats'} left
                </>
            )}
        </p>
    );
}

/**
 * The reveal: reward first, receipt last. A full-bleed hero of the matched
 * trip opens behind canyon-curtain panels, the river calls you by name, and
 * the reasons tick in like a guide counting on fingers. The editable
 * answers ("your trip log") wait at the bottom of the page.
 */
export function TripFinderResults({
    matches,
    answers,
    availabilityBySlug,
    arcticDown,
}: TripFinderResultsProps) {
    const [best, ...alternates] = matches;
    // A "Best Match" claim must be earned: a real score, no age conflict,
    // and at least two actual answers — never an alphabetical accident
    // dressed up in a ribbon.
    const confident =
        best !== undefined &&
        best.score >= MIN_CONFIDENT_SCORE &&
        !best.ageConflict &&
        answeredQuestionCount(answers) >= 2;

    const riverName = best?.trip.river?.name ?? null;
    const heroImage = best?.trip.image
        ? imageUrl(best.trip.image, 1920, 1080)
        : '';
    const bestSlug = best?.trip.slug?.current;
    const bestAvailability = bestSlug
        ? availabilityBySlug.get(bestSlug)
        : undefined;

    const answeredChips = TRIP_FINDER_QUESTIONS.filter(
        (q) =>
            answers[q.id] !== null &&
            (q.id !== 'age' || answers.who === 'kids'),
    );

    return (
        <>
            {best && (
                // Subtracts the site header's approximate height so the
                // choreographed reveal plays inside the first viewport.
                // Reveal content centers in the hero rather than pinning to
                // the bottom — same neck-craner fix as the wizard screens.
                <div className='relative flex min-h-[calc(100svh-84px)] flex-col justify-center overflow-hidden md:min-h-[calc(100svh-96px)]'>
                    {/* Backdrop layer: photo + scrim; positioned content
                        below stacks above it. */}
                    <div className='absolute inset-0 bg-evergreen'>
                        {heroImage ? (
                            <Image
                                src={heroImage}
                                alt={`${best.trip.name ?? 'Your matched trip'} — on the water`}
                                fill
                                priority
                                sizes='100vw'
                                className='object-cover'
                            />
                        ) : (
                            <Image
                                src='/trip-finder/splash-wide.jpg'
                                alt='A Holiday raft running a splashy rapid beneath canyon walls'
                                fill
                                priority
                                sizes='100vw'
                                className='object-cover'
                            />
                        )}
                        <div
                            aria-hidden='true'
                            className='absolute inset-0 bg-gradient-to-t from-evergreen via-evergreen/45 to-evergreen/15'
                        />
                    </div>
                    {/* A wall of whitewater drains off the hero, foam edge
                        sweeping down as the match emerges. Invisible when
                        reduced motion keeps the animation from running. */}
                    <div
                        aria-hidden='true'
                        className='finder-wave pointer-events-none absolute inset-x-0 bottom-0 top-[-24px] z-10 opacity-0'
                    />

                    {/* The 60-years seal stamps in last. */}
                    <Image
                        src='/badge-60-years.svg'
                        alt='60 years of going with the flow'
                        width={164}
                        height={164}
                        className='absolute right-6 top-6 h-24 w-24 md:right-10 md:top-10 md:h-36 md:w-36 motion-safe:animate-finder-stamp motion-safe:[animation-delay:1.5s]'
                    />

                    <div className='relative mx-auto w-full max-w-5xl px-4 py-24 md:px-10'>
                        {/* Teal glass panel: the reveal reads over any photo
                            — bright sky, white water — without dimming the
                            whole hero. */}
                        <div className='max-w-3xl bg-[#16443c]/75 p-6 backdrop-blur-sm md:p-9'>
                            <p className='font-alt-gothic text-subheading font-bold uppercase tracking-wide text-opal motion-safe:animate-finder-rise motion-safe:[animation-delay:0.35s]'>
                                {confident
                                    ? 'Five answers. Sixty years of trips. One match.'
                                    : 'Find Your Trip'}
                            </p>
                            <h1 className='mt-2 font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1 motion-safe:animate-finder-rise motion-safe:[animation-delay:0.6s]'>
                                {confident
                                    ? riverName
                                        ? `The ${riverName} is calling`
                                        : 'Your river is calling'
                                    : 'Close — this is what guides are for'}
                            </h1>
                            {!confident && (
                                <p className='mt-3 max-w-2xl text-paragraph leading-paragraph text-holiday-white motion-safe:animate-finder-rise motion-safe:[animation-delay:0.7s]'>
                                    Tell us one or two more things and the match
                                    gets sharper — or skip the quiz entirely:{' '}
                                    {CALL_LINE}
                                </p>
                            )}

                            <div className='mt-5 motion-safe:animate-finder-rise motion-safe:[animation-delay:0.85s]'>
                                {confident && (
                                    <span className='inline-block bg-holiday-red px-3.5 py-1.5 text-[14px] font-bold uppercase leading-tight text-holiday-white'>
                                        Best Match
                                    </span>
                                )}
                                <h2 className='mt-2 font-alt-gothic text-section font-black uppercase text-holiday-white'>
                                    {best.trip.name}
                                    {best.trip.subtitle && (
                                        <span className='block text-subheading leading-tight text-opal'>
                                            {best.trip.subtitle}
                                        </span>
                                    )}
                                </h2>
                                <p className='mt-1 text-body font-bold leading-body text-holiday-white/85'>
                                    {[
                                        best.trip.river?.name,
                                        best.trip.durationLabel ??
                                            (best.trip.duration
                                                ? `${best.trip.duration} Days`
                                                : null),
                                        best.trip.startingPrice
                                            ? `Starts at ${best.trip.startingPrice}`
                                            : null,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                            </div>

                            <div className='mt-5 max-w-2xl'>
                                <h3 className='sr-only'>Why it fits</h3>
                                {best.reasons.length > 0 ? (
                                    <ul className='space-y-1.5'>
                                        {best.reasons.map((reason, i) => (
                                            <li
                                                key={reason}
                                                className='flex gap-3 text-paragraph leading-paragraph text-holiday-white motion-safe:animate-finder-rise'
                                                style={{
                                                    animationDelay: `${1.05 + i * 0.15}s`,
                                                }}
                                            >
                                                <span
                                                    aria-hidden='true'
                                                    className='font-bold text-opal'
                                                >
                                                    &#10003;
                                                </span>
                                                {reason}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className='text-paragraph leading-paragraph text-holiday-white motion-safe:animate-finder-rise motion-safe:[animation-delay:1.05s]'>
                                        A great all-around pick from what you
                                        told us so far.
                                    </p>
                                )}
                                {best.caveats.map((caveat) => (
                                    <p
                                        key={caveat}
                                        className='mt-3 border-l-4 border-sand pl-3 text-body leading-body text-holiday-white/90'
                                    >
                                        {caveat}
                                    </p>
                                ))}
                                {/* "Both" means the raft & ride combos —
                                    until those trips are authored on the
                                    site, be straight about it and hand off
                                    to a human, guide-style. */}
                                {answers.activity === 'both' &&
                                    (best.trip.activities?.length ?? 0) < 2 && (
                                        <p className='mt-3 border-l-4 border-teal pl-3 text-body leading-body text-holiday-white/90'>
                                            After the true raft &amp; ride combo
                                            — pedal the White Rim, then run
                                            Cataract? Those trips aren&rsquo;t
                                            bookable online yet. Call{' '}
                                            <a
                                                href='tel:+18012662087'
                                                className='font-bold underline underline-offset-4 transition-opacity hover:opacity-70'
                                            >
                                                801-266-2087
                                            </a>{' '}
                                            and we&rsquo;ll build yours.
                                        </p>
                                    )}
                            </div>

                            <div className='mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 motion-safe:animate-finder-rise motion-safe:[animation-delay:1.35s]'>
                                {bestAvailability ? (
                                    <>
                                        <AvailabilityLine
                                            availability={bestAvailability}
                                            tone='light'
                                        />
                                        <Button
                                            href={bestAvailability.bookHref}
                                            size='lg'
                                        >
                                            See Dates &amp; Book
                                        </Button>
                                    </>
                                ) : (
                                    <p className='text-body leading-body text-holiday-white'>
                                        {arcticDown
                                            ? 'Live availability is napping. '
                                            : 'No open online dates right now. '}
                                        {CALL_LINE}
                                    </p>
                                )}
                                <Link
                                    href={`/trips/${bestSlug ?? ''}`}
                                    className={buttonClasses({
                                        variant: 'outline',
                                        className:
                                            'border-holiday-white text-holiday-white hover:bg-holiday-white hover:text-evergreen',
                                    })}
                                >
                                    Trip Details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {alternates.length > 0 && (
                <Section background='white' className='py-14 md:py-16'>
                    <h2 className='font-alt-gothic text-section font-black uppercase text-onyx'>
                        Worth Scouting
                    </h2>
                    <div className='mt-6 grid gap-10 sm:grid-cols-2 lg:max-w-4xl'>
                        {alternates.map((match) => {
                            const slug = match.trip.slug?.current;
                            return (
                                <div key={match.trip._id}>
                                    <TripCard {...cardProps(match)} />
                                    {match.reasons.slice(0, 2).map((reason) => (
                                        <p
                                            key={reason}
                                            className='mt-2 text-body leading-body text-onyx/80'
                                        >
                                            <span
                                                aria-hidden='true'
                                                className='font-bold text-teal'
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
                                    <div className='mt-2'>
                                        <AvailabilityLine
                                            availability={
                                                slug
                                                    ? availabilityBySlug.get(
                                                          slug,
                                                      )
                                                    : undefined
                                            }
                                            tone='dark'
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* The receipt, after the reward: editable trip log + human out. */}
            <Section background='evergreen' className='py-12'>
                <h2 className='font-alt-gothic text-subheading font-bold uppercase tracking-wide text-opal'>
                    Your trip log
                </h2>
                <ul className='mt-4 flex flex-wrap gap-2'>
                    {answeredChips.map((question) => (
                        <li key={question.id}>
                            <Link
                                href={`/trip-finder?${answersToParams(answers, {
                                    [question.id]: null,
                                })}`}
                                className='flex min-h-11 items-center border border-holiday-white/45 px-3.5 py-2 text-[14px] font-bold leading-tight text-holiday-white transition-colors hover:border-opal hover:text-opal'
                            >
                                {question.shortLabel}:{' '}
                                {answerLabel(
                                    question.id as QuestionId,
                                    answers[question.id] as string | number,
                                )}
                                <span
                                    aria-hidden='true'
                                    className='ml-2 text-opal'
                                >
                                    &#9998;
                                </span>
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
                            className='flex min-h-11 items-center px-3.5 py-2 text-[14px] font-bold leading-tight text-holiday-white underline decoration-opal decoration-2 underline-offset-4 transition-opacity hover:opacity-70'
                        >
                            Start over
                        </Link>
                    </li>
                </ul>
                <p className='mt-6 max-w-2xl text-paragraph leading-paragraph'>
                    Still not sure? {CALL_LINE}
                </p>
            </Section>
        </>
    );
}
