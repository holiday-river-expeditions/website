/**
 * Topographic texture motif — the brand's hand-drawn map language rendered
 * as an inline SVG divider. Two variants:
 *  - 'river': a single meandering stroke, like a river reach on a topo map.
 *    Draws itself on scroll-reveal (stroke-dashoffset, motion-safe only).
 *  - 'contour': nested contour lines, static.
 *
 * Decorative only (aria-hidden). Color via any Tailwind text-* class on
 * `className` — strokes use currentColor.
 */

interface TopoDividerProps {
    variant?: 'river' | 'contour';
    className?: string;
    /** Mirror vertically so consecutive dividers read as one meander. */
    flip?: boolean;
}

export function TopoDivider({
    variant = 'river',
    className = 'text-opal',
    flip = false,
}: TopoDividerProps) {
    return (
        <div aria-hidden data-reveal className={`overflow-hidden ${className}`}>
            {variant === 'river' ? (
                <svg
                    viewBox='0 0 1440 48'
                    fill='none'
                    preserveAspectRatio='none'
                    className={`h-8 w-full md:h-12 ${flip ? '-scale-y-100' : ''}`}
                >
                    <path
                        className='topo-river-path'
                        pathLength={1}
                        d='M-8 30 C 90 6, 180 44, 290 26 S 480 4, 590 28 S 770 46, 880 22 S 1060 2, 1170 26 S 1360 44, 1448 18'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                    />
                </svg>
            ) : (
                <svg
                    viewBox='0 0 1440 64'
                    fill='none'
                    preserveAspectRatio='none'
                    className={`h-10 w-full md:h-16 ${flip ? '-scale-y-100' : ''}`}
                >
                    <path
                        d='M-8 50 C 160 22, 340 58, 520 40 S 880 14, 1060 38 S 1360 56, 1448 34'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        opacity='0.8'
                    />
                    <path
                        d='M-8 38 C 170 12, 350 48, 530 30 S 890 6, 1070 28 S 1370 46, 1448 24'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        opacity='0.5'
                    />
                    <path
                        d='M-8 26 C 180 4, 360 38, 540 22 S 900 0, 1080 20 S 1380 36, 1448 14'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        opacity='0.3'
                    />
                </svg>
            )}
        </div>
    );
}
