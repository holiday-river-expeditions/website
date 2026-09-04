import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import type { ResultAvailability } from '@/components/ui/TripFinderResults';
import {
    answerLabel,
    answersToParams,
    chosenMonth,
    chosenOption,
    currentStep,
    effectiveMinAge,
    isApplicable,
    MONTH_NAMES,
    parseArcticIds,
    SCORING,
    type QuestionKind,
    type TripFinderAnswers,
    type TripFinderSpec,
    type TripFinderTrip,
    type TripMatch,
} from '@/lib/trip-finder';

/**
 * The wizard's reasoning, laid bare for Holiday: where the questions came
 * from, what the visitor has said so far, how every trip in the catalog
 * scored on every question and why, which facts came from Sanity versus
 * Arctic, and which trips are missing the facts the matcher needs.
 *
 * Server-rendered and zero-JS (native <details>), shipped in the markup of
 * every wizard page and shown only in a browser armed with the
 * `finder-logic` demo flag — the same CSS gate every flag uses. Because
 * every answer is a link, the panel re-renders with the page: the "watch
 * it live" half is the URL changing under it.
 *
 * An in-flow section rather than a floating overlay: the four bottom
 * corners are already claimed, and a ranking table needs the width.
 */

/** Arctic's part in the results, for the data-sources section. Null on
    wizard steps, where nothing from Arctic is fetched. */
export interface LogicPanelArctic {
    down: boolean;
    departures: number;
    bookableTypes: number;
}

interface TripFinderLogicPanelProps {
    spec: TripFinderSpec;
    answers: TripFinderAnswers;
    /** The whole ranked catalog, not just the top results. */
    ranking: TripMatch[];
    availabilityBySlug?: ReadonlyMap<string, ResultAvailability>;
    arctic: LogicPanelArctic | null;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const months = (list: readonly number[]) =>
    list.map((m) => MONTH_NAMES[m - 1]?.slice(0, 3) ?? m).join(', ');

/** The trip fact a question's matcher read, as the panel's "this trip" cell. */
function tripFact(
    kind: QuestionKind,
    trip: TripFinderTrip,
    month: number | null,
): string {
    switch (kind) {
        case 'thrill': {
            if (trip.maxRapidClass == null) return 'no Max Rapid Class';
            const crafts = trip.craftTypes ?? [];
            return `Class ${trip.maxRapidClass}${crafts.length ? ` · ${crafts.join(', ')}` : ''}`;
        }
        case 'age': {
            const min = effectiveMinAge(trip, month);
            return min === null ? 'no Minimum Age' : `minimum age ${min}`;
        }
        case 'days':
            return trip.duration == null
                ? 'no Duration'
                : `${trip.duration} days`;
        case 'month':
            return trip.seasonMonths?.length
                ? months(trip.seasonMonths)
                : 'no Season (months)';
        case 'activity':
            return trip.tripType?.slug?.current ?? 'no Trip Type';
        case 'who':
            return '—';
    }
}

/** What each answer asked the matcher for, from its dial. */
function askedFor(
    spec: TripFinderSpec,
    answers: TripFinderAnswers,
    kind: QuestionKind,
) {
    const option = chosenOption(spec, answers, kind);
    if (!option) return '—';
    if (option.targetClass !== undefined) return `Class ${option.targetClass}`;
    if (option.floorAge !== undefined) return `youngest is ${option.floorAge}`;
    if (option.centerDays !== undefined)
        return `about ${option.centerDays} days`;
    if (option.month !== undefined) return MONTH_NAMES[option.month - 1];
    if (option.tripTypeSlug !== undefined) return option.tripTypeSlug;
    return option.label;
}

/** Trip Finder tab fields the matcher would read, missing on this trip. */
function missingFacts(trip: TripFinderTrip): string[] {
    const missing: string[] = [];
    if (!trip.tripType?.slug?.current) missing.push('Trip Type');
    if (trip.duration == null) missing.push('Duration');
    if (trip.minAge == null) missing.push('Minimum Age');
    if (
        trip.maxRapidClass == null &&
        trip.tripType?.slug?.current !== 'biking'
    ) {
        missing.push('Max Rapid Class');
    }
    if (!trip.seasonMonths?.length) missing.push('Season (months)');
    if (!trip.craftTypes?.length && trip.tripType?.slug?.current !== 'biking') {
        missing.push('Craft Types');
    }
    if (!trip.arcticTripId) missing.push('Arctic Trip ID');
    return missing;
}

const summaryClass =
    'cursor-pointer list-none font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.05em] text-onyx [&::-webkit-details-marker]:hidden before:mr-2 before:inline-block before:transition-transform before:content-["▸"] [[open]>&]:before:rotate-90';
const tableClass =
    'mt-3 w-full border-collapse text-left text-[14px] leading-snug';
const thClass =
    'border-b border-holiday-grey/40 py-1.5 pr-4 text-[12px] font-bold uppercase tracking-wider text-onyx/70';
const tdClass = 'border-b border-holiday-grey/20 py-1.5 pr-4 align-top';
const blockClass =
    'border border-holiday-grey/40 bg-holiday-white p-4 shadow-lg';

export function TripFinderLogicPanel({
    spec,
    answers,
    ranking,
    availabilityBySlug,
    arctic,
}: TripFinderLogicPanelProps) {
    const step = currentStep(spec, answers);
    const month = chosenMonth(spec, answers);
    const query = answersToParams(spec, answers);
    const [top] = ranking;
    const gate = spec.tuning.minConfidentScore;

    return (
        <div className='hidden [[data-demo-finder-logic=on]_&]:block'>
            <Section
                background='sand'
                className='border-t-4 border-holiday-red py-10'
            >
                <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1'>
                    <h2 className='font-alt-gothic text-section font-black uppercase text-onyx'>
                        Trip finder logic
                    </h2>
                    <p className='text-[12px] uppercase tracking-wider text-onyx/85'>
                        Demo panel · visible only in this browser
                    </p>
                </div>
                <p className='mt-2 max-w-3xl text-[14px] leading-snug text-onyx/90'>
                    Everything below is what the site is actually doing on this
                    page. Questions are{' '}
                    {spec.source === 'sanity' ? (
                        <>
                            coming from the Studio&rsquo;s{' '}
                            <Link
                                href='/studio/structure/tripFinderSpec'
                                className='font-bold underline underline-offset-2 hover:text-holiday-red'
                            >
                                Trip Finder document
                            </Link>
                        </>
                    ) : (
                        <strong>
                            the built-in fallback — no usable Trip Finder
                            document is published
                        </strong>
                    )}
                    . Trip facts come from each trip&rsquo;s Trip Finder tab in
                    Sanity. Dates and seats come from Arctic and never affect
                    the ranking.
                </p>

                <div className='mt-6 grid gap-4'>
                    {/* 1. Answers so far */}
                    <details open className={blockClass}>
                        <summary className={summaryClass}>
                            What the visitor has told us
                        </summary>
                        <p className='mt-2 text-[12px] text-onyx/70'>
                            The page address is the whole state:{' '}
                            <code className='text-onyx'>
                                /trip-finder{query ? `?${query}` : ''}
                            </code>
                            . Now asking:{' '}
                            <strong className='text-onyx'>
                                {step === 'results'
                                    ? 'nothing — showing results'
                                    : `“${spec.questions.find((q) => q.id === step)?.title ?? step}”`}
                            </strong>
                        </p>
                        <table className={tableClass}>
                            <thead>
                                <tr>
                                    <th scope='col' className={thClass}>
                                        Question
                                    </th>
                                    <th scope='col' className={thClass}>
                                        Answer
                                    </th>
                                    <th scope='col' className={thClass}>
                                        Asks the matcher for
                                    </th>
                                    <th scope='col' className={thClass}>
                                        Weight
                                    </th>
                                    <th scope='col' className={thClass}>
                                        Rule
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {spec.questions.map((q) => {
                                    const value = answers[q.id];
                                    const applicable = isApplicable(
                                        spec,
                                        q.id,
                                        answers,
                                    );
                                    const rule = q.onlyWhen
                                        ? `only when ${q.onlyWhen.question} = ${q.onlyWhen.answer}`
                                        : q.skipWhen
                                          ? `skipped when ${q.skipWhen.question} = ${q.skipWhen.answer}`
                                          : 'always asked';
                                    return (
                                        <tr
                                            key={q.id}
                                            className={
                                                applicable ? '' : 'text-onyx/70'
                                            }
                                        >
                                            <td className={tdClass}>
                                                <span className='font-bold'>
                                                    {q.shortLabel}
                                                </span>{' '}
                                                <span className='text-onyx/70'>
                                                    ({q.id})
                                                </span>
                                            </td>
                                            <td className={tdClass}>
                                                {value === null
                                                    ? applicable
                                                        ? 'not yet'
                                                        : 'not asked'
                                                    : answerLabel(
                                                          spec,
                                                          q.id,
                                                          value,
                                                      )}
                                            </td>
                                            <td className={tdClass}>
                                                {askedFor(spec, answers, q.id)}
                                            </td>
                                            <td className={tdClass}>
                                                {q.id === 'who'
                                                    ? '—'
                                                    : q.weight}
                                            </td>
                                            <td className={tdClass}>
                                                {rule}
                                                {!applicable &&
                                                    ' — not on this path'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </details>

                    {/* 2. Ranking */}
                    <details open className={blockClass}>
                        <summary className={summaryClass}>
                            How every trip scores
                        </summary>
                        <p className='mt-2 text-[12px] text-onyx/70'>
                            Each answered question scores a trip from 0 to 1,
                            then the scores are averaged using the weights. A
                            trip with no fact for a question scores{' '}
                            {SCORING.unknownScore} (unknown, not disqualified).
                            Skipped questions don&rsquo;t count. A failed
                            minimum age sinks a trip below every clean fit.{' '}
                            {top &&
                                (top.score >= gate && !top.ageConflict
                                    ? `Top score ${pct(top.score)} clears the ${pct(gate)} Best Match threshold.`
                                    : `Top score ${pct(top.score)} is under the ${pct(gate)} Best Match threshold, so the page leads with call-us.`)}
                        </p>
                        <ol aria-label='Ranking' className='mt-3 grid gap-2'>
                            {ranking.map((match, index) => {
                                const slug = match.trip.slug?.current ?? '';
                                return (
                                    <li key={match.trip._id}>
                                        <details className='border border-holiday-grey/30 px-3 py-2'>
                                            <summary className='cursor-pointer list-none text-[14px] leading-snug [&::-webkit-details-marker]:hidden'>
                                                <span className='font-bold'>
                                                    {index + 1}.{' '}
                                                    {match.trip.name ?? slug}
                                                </span>{' '}
                                                <span className='text-onyx/70'>
                                                    — {pct(match.score)}
                                                    {index <
                                                        spec.tuning
                                                            .resultsShown &&
                                                        ' · shown'}
                                                    {match.ageConflict &&
                                                        ' · age conflict'}
                                                    {match.unknownCount > 0 &&
                                                        ` · ${match.unknownCount} unknown`}
                                                </span>
                                            </summary>
                                            {match.breakdown.length === 0 ? (
                                                <p className='mt-2 text-[12px] text-onyx/70'>
                                                    Nothing answered yet, so
                                                    every trip sits at{' '}
                                                    {SCORING.unknownScore}.
                                                </p>
                                            ) : (
                                                <table className={tableClass}>
                                                    <thead>
                                                        <tr>
                                                            <th
                                                                scope='col'
                                                                className={
                                                                    thClass
                                                                }
                                                            >
                                                                Question
                                                            </th>
                                                            <th
                                                                scope='col'
                                                                className={
                                                                    thClass
                                                                }
                                                            >
                                                                Asked for
                                                            </th>
                                                            <th
                                                                scope='col'
                                                                className={
                                                                    thClass
                                                                }
                                                            >
                                                                This trip
                                                            </th>
                                                            <th
                                                                scope='col'
                                                                className={
                                                                    thClass
                                                                }
                                                            >
                                                                Score
                                                            </th>
                                                            <th
                                                                scope='col'
                                                                className={
                                                                    thClass
                                                                }
                                                            >
                                                                × weight
                                                            </th>
                                                            <th
                                                                scope='col'
                                                                className={
                                                                    thClass
                                                                }
                                                            >
                                                                Says
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {match.breakdown.map(
                                                            (b) => (
                                                                <tr
                                                                    key={b.kind}
                                                                >
                                                                    <td
                                                                        className={
                                                                            tdClass
                                                                        }
                                                                    >
                                                                        {b.kind}
                                                                    </td>
                                                                    <td
                                                                        className={
                                                                            tdClass
                                                                        }
                                                                    >
                                                                        {askedFor(
                                                                            spec,
                                                                            answers,
                                                                            b.kind,
                                                                        )}
                                                                    </td>
                                                                    <td
                                                                        className={
                                                                            tdClass
                                                                        }
                                                                    >
                                                                        {tripFact(
                                                                            b.kind,
                                                                            match.trip,
                                                                            month,
                                                                        )}
                                                                    </td>
                                                                    <td
                                                                        className={
                                                                            tdClass
                                                                        }
                                                                    >
                                                                        {b.rawScore.toFixed(
                                                                            2,
                                                                        )}
                                                                        {b.unknown &&
                                                                            ' (unknown)'}
                                                                    </td>
                                                                    <td
                                                                        className={
                                                                            tdClass
                                                                        }
                                                                    >
                                                                        {b.weightedContribution.toFixed(
                                                                            2,
                                                                        )}
                                                                    </td>
                                                                    <td
                                                                        className={`${tdClass} text-onyx/80`}
                                                                    >
                                                                        {b.reason ??
                                                                            b.caveat ??
                                                                            '—'}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            )}
                                        </details>
                                    </li>
                                );
                            })}
                        </ol>
                    </details>

                    {/* 3. Data sources */}
                    <details className={blockClass}>
                        <summary className={summaryClass}>
                            Where each trip&rsquo;s facts come from
                        </summary>
                        <p className='mt-2 text-[12px] text-onyx/70'>
                            Sanity supplies every fact the matcher reads. Arctic
                            supplies only the next open date and seat count,
                            joined on the trip&rsquo;s Arctic Trip ID.{' '}
                            {arctic === null
                                ? 'Arctic is not consulted until the results page.'
                                : arctic.down
                                  ? 'Arctic was unreachable for this page — cards fall back to the phone line.'
                                  : `Arctic returned ${arctic.departures} upcoming departures across ${arctic.bookableTypes} bookable trip types.`}
                        </p>
                        <table className={tableClass}>
                            <thead>
                                <tr>
                                    <th scope='col' className={thClass}>
                                        Trip
                                    </th>
                                    <th scope='col' className={thClass}>
                                        Sanity facts
                                    </th>
                                    <th scope='col' className={thClass}>
                                        Arctic join
                                    </th>
                                    <th scope='col' className={thClass}>
                                        Arctic says
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map(({ trip }) => {
                                    const slug = trip.slug?.current ?? '';
                                    const ids = parseArcticIds(
                                        trip.arcticTripId,
                                    );
                                    const availability =
                                        availabilityBySlug?.get(slug);
                                    return (
                                        <tr key={trip._id}>
                                            <td
                                                className={`${tdClass} font-bold`}
                                            >
                                                {trip.name ?? slug}
                                            </td>
                                            <td className={tdClass}>
                                                {tripFact(
                                                    'activity',
                                                    trip,
                                                    month,
                                                )}{' '}
                                                ·{' '}
                                                {tripFact('days', trip, month)}{' '}
                                                · {tripFact('age', trip, null)}{' '}
                                                ·{' '}
                                                {tripFact(
                                                    'thrill',
                                                    trip,
                                                    month,
                                                )}{' '}
                                                ·{' '}
                                                {tripFact('month', trip, month)}
                                            </td>
                                            <td className={tdClass}>
                                                {ids.length
                                                    ? `trip type ${ids.join(', ')}`
                                                    : 'no Arctic Trip ID'}
                                            </td>
                                            <td className={tdClass}>
                                                {arctic === null
                                                    ? '—'
                                                    : availability
                                                      ? `${availability.dateLabel}${availability.remaining !== null ? `, ${availability.remaining} seats` : ''}`
                                                      : arctic.down
                                                        ? 'unreachable'
                                                        : isShown(
                                                                ranking,
                                                                slug,
                                                                spec.tuning
                                                                    .resultsShown,
                                                            )
                                                          ? 'no open dates'
                                                          : 'not looked up (not shown)'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </details>

                    {/* 4. Completeness */}
                    <details className={blockClass}>
                        <summary className={summaryClass}>
                            Trips missing facts
                        </summary>
                        <p className='mt-2 text-[12px] text-onyx/70'>
                            A missing fact scores {SCORING.unknownScore} on its
                            question, so trips without their Trip Finder tab
                            filled in coast on whatever is known. The values
                            seeded so far are placeholders Holiday has yet to
                            confirm.
                        </p>
                        {ranking.every(
                            (m) => missingFacts(m.trip).length === 0,
                        ) ? (
                            <p className='mt-3 text-[14px]'>
                                Every trip in Sanity has all its Trip Finder
                                facts.
                            </p>
                        ) : (
                            <ul className='mt-3 grid gap-1 text-[14px] leading-snug'>
                                {ranking
                                    .filter(
                                        (m) => missingFacts(m.trip).length > 0,
                                    )
                                    .map(({ trip }) => (
                                        <li key={trip._id}>
                                            <span className='font-bold'>
                                                {trip.name ??
                                                    trip.slug?.current}
                                            </span>
                                            : {missingFacts(trip).join(', ')}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </details>

                    {/* 5. The dials that stay in code */}
                    <details className={blockClass}>
                        <summary className={summaryClass}>
                            Settings in use
                        </summary>
                        <dl className='mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[14px] leading-snug'>
                            <dt className='font-bold'>Best Match threshold</dt>
                            <dd>{gate} (Studio → Trip Finder → Tuning)</dd>
                            <dt className='font-bold'>Results shown</dt>
                            <dd>
                                {spec.tuning.resultsShown} (Studio → Trip Finder
                                → Tuning)
                            </dd>
                            <dt className='font-bold'>Unknown fact scores</dt>
                            <dd>{SCORING.unknownScore} (code)</dd>
                            <dt className='font-bold'>Craft-variety bonus</dt>
                            <dd>
                                +{SCORING.craftBonus} when two or more craft
                                types include an inflatable kayak (code)
                            </dd>
                            <dt className='font-bold'>Adjacent month</dt>
                            <dd>
                                {SCORING.adjacentMonthScore} when the trip runs
                                the month before or after (code)
                            </dd>
                            <dt className='font-bold'>Wrong trip type</dt>
                            <dd>
                                {SCORING.activityMismatchScore}, never zero
                                (code)
                            </dd>
                            <dt className='font-bold'>Combo trip</dt>
                            <dd>
                                {SCORING.comboScore} for either rafting or
                                biking (code)
                            </dd>
                        </dl>
                    </details>
                </div>
            </Section>
        </div>
    );
}

/** Availability is looked up only for the trips the results page shows. */
function isShown(ranking: TripMatch[], slug: string, shown: number) {
    return ranking.findIndex((m) => m.trip.slug?.current === slug) < shown;
}
