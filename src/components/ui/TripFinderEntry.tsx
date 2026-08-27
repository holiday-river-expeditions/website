import Image from 'next/image';
import Link from 'next/link';
import {
    TRIP_FINDER_QUESTIONS,
    type TripFinderQuestion,
} from '@/lib/trip-finder';

/**
 * The homepage "Find Your Trip" entry: a photographic band with question 1
 * rendered inline, so the first click is already an answer (zero-click
 * engagement, one-click momentum) and lands on question 2 at /trip-finder.
 * Server-rendered; gated by the trip-finder demo flag via CSS at the call
 * site. Text sits on the evergreen scrim, never on raw photo.
 */
export function TripFinderEntry() {
    const question = TRIP_FINDER_QUESTIONS[0] as TripFinderQuestion;

    return (
        <div className='relative overflow-hidden'>
            <div className='absolute inset-0 bg-evergreen'>
                <Image
                    src='/trip-finder/splash-wide.jpg'
                    alt=''
                    fill
                    sizes='100vw'
                    className='object-cover'
                />
                <div
                    aria-hidden='true'
                    className='absolute inset-0 bg-gradient-to-r from-evergreen/95 via-evergreen/75 to-evergreen/40'
                />
            </div>
            <div className='relative mx-auto max-w-7xl px-6 py-16 md:py-20'>
                <div className='max-w-2xl' data-reveal>
                    <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-white'>
                        Find Your Trip
                    </h2>
                    <p className='mt-3 text-paragraph leading-paragraph text-holiday-white'>
                        Five questions, zero wrong answers. Like talking to a
                        guide, minus the sunburn.
                    </p>
                    <p className='mt-6 font-alt-gothic text-subheading font-bold uppercase text-opal'>
                        {question.title}
                    </p>
                    <div className='mt-4 flex flex-wrap gap-3'>
                        {question.options.map((option) => (
                            <Link
                                key={option.value}
                                href={`/trip-finder?${question.id}=${option.value}`}
                                className='water-fill group flex min-h-[64px] flex-col justify-center bg-holiday-white/95 px-5 py-4 text-left transition-transform active:scale-[0.98]'
                            >
                                <span className='block font-alt-gothic text-subheading font-bold uppercase leading-tight text-onyx transition-colors group-hover:text-holiday-white group-focus-visible:text-holiday-white'>
                                    {option.label}
                                </span>
                                {option.sublabel && (
                                    <span className='mt-0.5 block text-[14px] leading-snug text-onyx/75 transition-colors group-hover:text-holiday-white/90 group-focus-visible:text-holiday-white/90'>
                                        {option.sublabel}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                    <p className='mt-6 text-body leading-body'>
                        <Link
                            href='/trip-finder'
                            className='font-bold text-holiday-white underline decoration-opal decoration-2 underline-offset-4 transition-opacity hover:opacity-70'
                        >
                            or start from the top &rarr;
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
