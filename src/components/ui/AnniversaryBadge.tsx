/**
 * The anniversary seal from the hero. Holiday launched in 1966, and once
 * the count passes 60 the seal reads "60+" (Darius: a plus rather than a
 * raw number, so the artwork stays the artwork). The original "60"
 * artwork is referenced from the static SVG via <use>, so the ~20 KB of
 * path data stays a cached file instead of shipping inline with every
 * page; from 2027 a small Alternate Gothic plus sits at the top-right of
 * the zero, inside the ring, with the seal's tilt.
 */

export const FOUNDED_YEAR = 1966;

/** The seal artwork; its outer <g id="seal"> is what <use> pulls in. */
export const BADGE_SRC = '/badge-60-years.svg';

export function anniversaryYears(now = new Date()): number {
    return now.getFullYear() - FOUNDED_YEAR;
}

/** "60" through 2026, "60+" after. */
export function anniversaryLabel(years: number): string {
    return years > 60 ? '60+' : '60';
}

export function AnniversaryBadge({
    className = '',
    years = anniversaryYears(),
}: {
    className?: string;
    /** Override for tests and previews; defaults to the real count. */
    years?: number;
}) {
    const label = anniversaryLabel(years);
    return (
        <svg
            viewBox='0 0 165 165'
            role='img'
            aria-label={`${label} years of going with the flow`}
            className={className}
        >
            <use href={`${BADGE_SRC}#seal`} />
            {label === '60+' && (
                // Top-right of the zero (which ends at x≈125, y≈34); the
                // ring lettering all sits below, so this corner is clear.
                <text
                    x='128'
                    y='60'
                    fontFamily='var(--font-alt-gothic)'
                    fontWeight='900'
                    fontSize='34'
                    fill='white'
                    transform='rotate(-4.05064 82.2224 82.2224)'
                >
                    +
                </text>
            )}
        </svg>
    );
}
