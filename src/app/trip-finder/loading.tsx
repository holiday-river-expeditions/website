/**
 * Streams instantly on every wizard navigation while the server renders the
 * next step (or ranks results against live availability) — the answer tap
 * is never a silent dead click, even on canyon-country LTE.
 */
export default function TripFinderLoading() {
    return (
        <div className='flex min-h-[100svh] flex-col items-center justify-center gap-4 bg-evergreen px-6'>
            <svg
                viewBox='0 0 120 24'
                className='w-28 text-opal'
                aria-hidden='true'
            >
                <path
                    d='M2 14 C 18 4, 30 22, 46 12 S 76 4, 92 14 S 112 20, 118 10'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='3'
                    strokeLinecap='round'
                    pathLength={1}
                    className='motion-safe:animate-spark-draw'
                />
            </svg>
            <p className='font-alt-gothic text-subheading font-bold uppercase tracking-wide text-holiday-white'>
                Reading the water&hellip;
            </p>
        </div>
    );
}
