import Link from 'next/link';
import type { ReactNode } from 'react';

export interface TripFact {
    label: string;
    value: string;
    href?: string;
}

const RAPID_CLASS_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

/** The trip fields the facts strip reads, as tripBySlugQuery projects them. */
interface TripFactsSource {
    startingPrice?: string | null;
    durationLabel?: string | null;
    maxRapidClass?: number | null;
    whoIsThisFor?: string | null;
    season?: string | null;
    minAge?: number | null;
    meetingPlace?: string | null;
    deposit?: string | null;
    river?: {
        riverLabel?: string | null;
        slug?: { current?: string | null } | null;
    } | null;
}

/**
 * The facts under a trip's banner, in display order. Rapid class replaces
 * the old difficulty scale (Justin's build-out doc). Trips with no
 * whitewater have no class, so they show who the trip is for in the same
 * slot rather than leaving a gap.
 */
export function tripFacts(trip: TripFactsSource): TripFact[] {
    const rapidClass =
        trip.maxRapidClass && RAPID_CLASS_NUMERALS[trip.maxRapidClass - 1]
            ? `Class ${RAPID_CLASS_NUMERALS[trip.maxRapidClass - 1]}`
            : null;

    const facts: TripFact[] = [];
    if (trip.startingPrice)
        facts.push({ label: 'Starts at', value: trip.startingPrice });
    if (trip.durationLabel)
        facts.push({ label: 'Duration', value: trip.durationLabel });
    if (rapidClass) {
        facts.push({ label: 'Whitewater', value: rapidClass });
    } else if (trip.whoIsThisFor) {
        facts.push({ label: 'Who it’s for', value: trip.whoIsThisFor });
    }
    if (trip.season) facts.push({ label: 'Season', value: trip.season });
    if (trip.minAge)
        facts.push({ label: 'Min Age', value: String(trip.minAge) });
    if (trip.meetingPlace)
        facts.push({ label: 'Meet at', value: trip.meetingPlace });
    if (trip.deposit) facts.push({ label: 'Deposit', value: trip.deposit });
    if (trip.river?.riverLabel)
        facts.push({
            label: 'River',
            value: trip.river.riverLabel,
            href: trip.river.slug?.current
                ? `/rivers/${trip.river.slug.current}`
                : undefined,
        });
    return facts;
}

/**
 * The facts strip on trip pages and specialty date pages. Justin, Sep 10:
 * 12px labels at a 1.3 line height; the sizing is fixed. Children render
 * as extra entries after the facts (the live river flow reading).
 */
export function TripFacts({
    facts,
    children,
}: {
    facts: readonly TripFact[];
    children?: ReactNode;
}) {
    return (
        <dl className='grid w-full grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:w-auto sm:flex-wrap sm:gap-x-10 sm:gap-y-4'>
            {facts.map((fact) => (
                <div key={fact.label}>
                    <dt className='font-alt-gothic text-[12px] font-medium uppercase leading-[1.3] tracking-[0.05em] text-onyx/70'>
                        {fact.label}
                    </dt>
                    <dd className='mt-1 font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-holiday-red'>
                        {fact.href ? (
                            <Link
                                href={fact.href}
                                className='transition-opacity hover:opacity-70'
                            >
                                {fact.value}
                            </Link>
                        ) : (
                            fact.value
                        )}
                    </dd>
                </div>
            ))}
            {children}
        </dl>
    );
}
