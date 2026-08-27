/**
 * Living anniversary seal (badge-live demo flag): the static 60-years
 * badge recreated as inline SVG with real text, so the number and date
 * range roll forward every year on their own — 61 in 2027, 62 in 2028 —
 * with no asset edits. Server component: the year is computed at render
 * and pages revalidate every minute, so New Year's needs no deploy.
 *
 * Animation: a single "stamp" settle on load (slight over-scale and
 * counter-rotation easing into place, like the seal being pressed) —
 * one-time, under motion-safe only, no persistent motion (vestibular
 * safety; NN/g: animation should communicate, then get out of the way).
 */

const FOUNDED = 1966;

export function AnniversaryBadge({ className = '' }: { className?: string }) {
    const years = new Date().getFullYear() - FOUNDED;

    return (
        <span className={`block ${className}`}>
            {/* The stamp animation lives on the svg, not the wrapper — the
                wrapper carries the caller's positioning transform, which an
                animated `transform` would override. */}
            <svg
                viewBox='0 0 200 200'
                role='img'
                aria-label={`${years} years of going with the flow, since ${FOUNDED}`}
                className='motion-safe:animate-badge-stamp'
            >
                <circle cx='100' cy='100' r='100' fill='#d00a0b' />
                <circle
                    cx='100'
                    cy='100'
                    r='86'
                    fill='none'
                    stroke='#fcfcfc'
                    strokeWidth='1.5'
                    strokeDasharray='3 5'
                />
                <defs>
                    <path
                        id='badge-arc-top'
                        d='M 28,100 A 72,72 0 0 1 172,100'
                    />
                    {/* Drawn left-to-right so the glyph tops face the
                        center — upright, classic badge style. */}
                    <path
                        id='badge-arc-bottom'
                        d='M 28,112 A 72,72 0 0 0 172,112'
                    />
                </defs>
                <text
                    fill='#fcfcfc'
                    className='font-alt-gothic'
                    fontSize='19'
                    fontWeight='600'
                    letterSpacing='2.5'
                >
                    <textPath
                        href='#badge-arc-top'
                        startOffset='50%'
                        textAnchor='middle'
                    >
                        YEARS OF GOING
                    </textPath>
                </text>
                <text
                    fill='#fcfcfc'
                    className='font-alt-gothic'
                    fontSize='19'
                    fontWeight='600'
                    letterSpacing='2.5'
                >
                    <textPath
                        href='#badge-arc-bottom'
                        startOffset='50%'
                        textAnchor='middle'
                    >
                        WITH THE FLOW
                    </textPath>
                </text>
                <text
                    x='100'
                    y='118'
                    fill='#fcfcfc'
                    className='font-alt-gothic'
                    fontSize='68'
                    fontWeight='900'
                    textAnchor='middle'
                >
                    {years}
                </text>
                <text
                    x='100'
                    y='140'
                    fill='#fcfcfc'
                    className='font-alt-gothic'
                    fontSize='13'
                    fontWeight='500'
                    letterSpacing='1.5'
                    textAnchor='middle'
                >
                    SINCE {FOUNDED}
                </text>
            </svg>
        </span>
    );
}
