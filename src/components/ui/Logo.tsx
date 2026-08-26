import Image from 'next/image';

/**
 * Logo lockup. Two treatments are rendered server-side and CSS picks one
 * via the per-browser demo flag `logo-bold` (see src/lib/demo-flags.ts):
 *
 *  - Classic (default): the original horizontal SVG brand lockup —
 *    /logo-horizontal-red.svg — per the Aug 2026 decision to return to
 *    the delivered logotype.
 *  - Bold (html[data-demo-logo-bold='on'] only): the live-text lockup —
 *    boat mark + wordmark in Alternate Gothic, with 'line' and 'stack'
 *    arrangements.
 *
 * Everything scales off the container font-size (the `size` classes), so
 * one number tunes the whole lockup. The hidden treatment is display:none
 * and therefore absent from the accessibility tree.
 *
 * Accessible name: the SVG image keeps alt='' because both call sites
 * (Header, Footer) wrap the lockup in a Link that carries
 * aria-label='Holiday River Expeditions home'. Standalone use needs the
 * caller to supply an accessible name.
 */
export function Logo({
    variant = 'stack',
    // Deliberately arbitrary rather than text-section/text-h2: those tokens
    // carry a line-height, and the lockup sets its own leading per variant to
    // match the mark's height. Bare font-size utilities emit no line-height.
    size = 'text-[36px] md:text-[44px]',
    color = 'text-holiday-red',
    className = '',
}: {
    variant?: 'line' | 'stack';
    size?: string;
    color?: string;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-[0.28em] ${size} ${className}`}
        >
            <Image
                src='/logo-horizontal-red.svg'
                alt=''
                width={2000}
                height={798}
                className='h-[1em] w-auto [[data-demo-logo-bold=on]_&]:hidden'
            />
            <span className='hidden items-center gap-[0.28em] [[data-demo-logo-bold=on]_&]:inline-flex'>
                <Image
                    src='/logo-icon-red.svg'
                    alt=''
                    width={119}
                    height={200}
                    className='h-[1em] w-auto'
                />
                {variant === 'line' ? (
                    <span
                        className={`whitespace-nowrap font-alt-gothic text-[1.32em] font-black uppercase leading-none tracking-[-0.01em] ${color}`}
                    >
                        Holiday River Expeditions
                    </span>
                ) : (
                    <span
                        className={`whitespace-nowrap font-alt-gothic text-[0.63em] font-black uppercase leading-[0.88] tracking-[-0.005em] ${color}`}
                    >
                        Holiday River
                        <br />
                        Expeditions
                    </span>
                )}
            </span>
        </span>
    );
}
