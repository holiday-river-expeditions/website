import Link from 'next/link';
import {
    TRIP_FINDER_QUESTIONS,
    type TripFinderQuestion,
} from '@/lib/trip-finder';

/**
 * The homepage "Find Your Trip" entry: question 1 rendered inline, so the
 * first click is already an answer (zero-click engagement, one-click
 * momentum) and lands on question 2 at /trip-finder. Server-rendered;
 * gated by the trip-finder demo flag via CSS at the call site.
 */
export function TripFinderEntry() {
    const question = TRIP_FINDER_QUESTIONS[0] as TripFinderQuestion;

    return (
        <div className='mx-auto max-w-3xl text-center' data-reveal>
            <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-red'>
                Find Your Trip
            </h2>
            <p className='mt-3 text-paragraph leading-paragraph text-onyx'>
                Five quick questions, zero wrong answers. We&rsquo;ll match you
                to the river (or trail) that fits.
            </p>
            <p className='mt-6 font-alt-gothic text-subheading font-bold uppercase text-onyx'>
                {question.title}
            </p>
            <div className='mt-4 flex flex-wrap justify-center gap-4'>
                {question.options.map((option) => (
                    <Link
                        key={option.value}
                        href={`/trip-finder?${question.id}=${option.value}`}
                        className='block border-2 border-onyx/25 bg-holiday-white px-6 py-4 text-left transition-colors hover:border-holiday-red focus-visible:border-holiday-red'
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
                ))}
            </div>
            <p className='mt-6 text-body leading-body'>
                <Link
                    href='/trip-finder'
                    className='font-bold text-teal underline underline-offset-4 transition-opacity hover:opacity-70'
                >
                    or answer all five &rarr;
                </Link>
            </p>
        </div>
    );
}
