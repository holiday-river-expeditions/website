import Image from 'next/image';

/**
 * Logo lockup. Five treatments are rendered server-side and CSS picks one
 * via the per-browser demo flags (see src/lib/demo-flags.ts). Precedence:
 * fresh > secondary > line > bold > classic.
 *
 *  - Classic (default): the original horizontal SVG brand lockup —
 *    /logo-horizontal-red.svg — per the Aug 2026 decision to return to
 *    the delivered logotype.
 *  - Bold stack (html[data-demo-logo-bold='on']): boat mark + stacked
 *    HOLIDAY RIVER / EXPEDITIONS wordmark in Alternate Gothic.
 *  - Single line (html[data-demo-logo-line='on']): boat mark + the
 *    wordmark on one line at medium weight.
 *  - Secondary (html[data-demo-logo-secondary='on']): the brand package's
 *    official Secondary Horizontal lockup SVG.
 *  - Fresh (html[data-demo-logo-fresh='on']): hierarchy exploration —
 *    HOLIDAY dominant, RIVER EXPEDITIONS letterspaced beneath.
 *
 * Everything scales off the container font-size (the `size` classes), so
 * one number tunes the whole lockup. Hidden treatments are display:none
 * and therefore absent from the accessibility tree.
 *
 * Accessible name: the SVG image keeps alt='' because both call sites
 * (Header, Footer) wrap the lockup in a Link that carries
 * aria-label='Holiday River Expeditions home'. Standalone use needs the
 * caller to supply an accessible name.
 */
export function Logo({
    // Deliberately arbitrary rather than text-section/text-h2: those tokens
    // carry a line-height, and the lockup sets its own leading per variant to
    // match the mark's height. Bare font-size utilities emit no line-height.
    size = 'text-[36px] md:text-[44px]',
    color = 'text-holiday-red',
    className = '',
}: {
    size?: string;
    color?: string;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-[0.28em] ${size} ${className}`}
        >
            <Image
                data-logo='classic'
                src='/logo-horizontal-red.svg'
                alt=''
                width={2000}
                height={798}
                className='h-[1em] w-auto [[data-demo-logo-bold=on]_&]:hidden [[data-demo-logo-line=on]_&]:hidden [[data-demo-logo-secondary=on]_&]:hidden [[data-demo-logo-fresh=on]_&]:hidden [[data-demo-logo-legacy=on]_&]:hidden'
            />
            <span
                data-logo='stack'
                className='hidden items-center gap-[0.28em] [[data-demo-logo-bold=on]:not([data-demo-logo-line=on]):not([data-demo-logo-secondary=on]):not([data-demo-logo-fresh=on]):not([data-demo-logo-legacy=on])_&]:inline-flex'
            >
                <Image
                    src='/logo-icon-red.svg'
                    alt=''
                    width={119}
                    height={200}
                    className='h-[1em] w-auto'
                />
                <span
                    className={`whitespace-nowrap font-alt-gothic text-[0.63em] font-black uppercase leading-[0.88] tracking-[-0.005em] ${color}`}
                >
                    Holiday River
                    <br />
                    Expeditions
                </span>
            </span>
            {/* Scaled to ~72% of the container em: the full-height single
                line dwarfs the header row and crowds the nav columns. */}
            <span
                data-logo='line'
                className='hidden items-center gap-[0.28em] text-[0.72em] [[data-demo-logo-line=on]:not([data-demo-logo-secondary=on]):not([data-demo-logo-fresh=on]):not([data-demo-logo-legacy=on])_&]:inline-flex'
            >
                <Image
                    src='/logo-icon-red.svg'
                    alt=''
                    width={119}
                    height={200}
                    className='h-[1.15em] w-auto'
                />
                {/* Weight tuned to sit near the official SVG logotype's
                    stroke (the Adobe kit ships real 100–900 cuts), at a size
                    a notch under cap-match. */}
                <span
                    className={`whitespace-nowrap font-alt-gothic text-[1.15em] font-medium uppercase leading-none tracking-[0.01em] ${color}`}
                >
                    Holiday River Expeditions
                </span>
            </span>
            {/* The brand package's Secondary Horizontal lockup — bigger mark,
                squarer proportions. Slightly over 1em so its compact width
                still carries presence in the header. */}
            <Image
                data-logo='secondary'
                src='/logo-secondary-red.svg'
                alt=''
                width={2001}
                height={1193}
                className='hidden h-[1.25em] w-auto [[data-demo-logo-secondary=on]:not([data-demo-logo-fresh=on]):not([data-demo-logo-legacy=on])_&]:block'
            />
            {/* Fresh hierarchy exploration: the brand name carries the
                lockup, the descriptor rides beneath as a letterspaced line
                stretched to the name's width. */}
            <span
                data-logo='fresh'
                className='hidden items-center gap-[0.3em] [[data-demo-logo-fresh=on]:not([data-demo-logo-legacy=on])_&]:inline-flex'
            >
                <Image
                    src='/logo-icon-red.svg'
                    alt=''
                    width={119}
                    height={200}
                    className='h-[1.05em] w-auto'
                />
                <span className='flex flex-col'>
                    <span
                        className={`whitespace-nowrap font-alt-gothic text-[0.78em] font-black uppercase leading-none tracking-[0.02em] ${color}`}
                    >
                        Holiday
                    </span>
                    <span
                        className={`mt-[0.09em] whitespace-nowrap font-alt-gothic text-[0.265em] font-medium uppercase leading-none tracking-[0.34em] ${color}`}
                    >
                        River Expeditions
                    </span>
                </span>
            </span>
            {/* Legacy lockup from the old website (bikeraft.com), recolored
                to brand red. Demo-only: the 2026 guidelines forbid mixing
                old logos in production. */}
            <Image
                data-logo='legacy'
                src='/logo-legacy-red.svg'
                alt=''
                width={908}
                height={374}
                className='hidden h-[1.15em] w-auto [[data-demo-logo-legacy=on]_&]:block'
            />
        </span>
    );
}
