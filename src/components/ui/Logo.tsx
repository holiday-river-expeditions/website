import Image from 'next/image';

/**
 * Logo lockup. Three treatments are rendered server-side and CSS picks one
 * via the per-browser demo flags (see src/lib/demo-flags.ts):
 *
 *  - Classic (default): the original horizontal SVG brand lockup —
 *    /logo-horizontal-red.svg — per the Aug 2026 decision to return to
 *    the delivered logotype.
 *  - Bold stack (html[data-demo-logo-bold='on']): boat mark + stacked
 *    HOLIDAY RIVER / EXPEDITIONS wordmark in Alternate Gothic.
 *  - Single line (html[data-demo-logo-line='on'], wins over the stack):
 *    boat mark + the wordmark on one line, caps at mark height.
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
                className='h-[1em] w-auto [[data-demo-logo-bold=on]_&]:hidden [[data-demo-logo-line=on]_&]:hidden'
            />
            <span
                data-logo='stack'
                className='hidden items-center gap-[0.28em] [[data-demo-logo-bold=on]:not([data-demo-logo-line=on])_&]:inline-flex'
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
                className='hidden items-center gap-[0.28em] text-[0.72em] [[data-demo-logo-line=on]_&]:inline-flex'
            >
                <Image
                    src='/logo-icon-red.svg'
                    alt=''
                    width={119}
                    height={200}
                    className='h-[1em] w-auto'
                />
                <span
                    className={`whitespace-nowrap font-alt-gothic text-[1.32em] font-black uppercase leading-none tracking-[-0.01em] ${color}`}
                >
                    Holiday River Expeditions
                </span>
            </span>
        </span>
    );
}
