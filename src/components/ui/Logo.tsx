import Image from 'next/image';

/**
 * Logo lockup: the horizontal SVG brand lockup, /logo-horizontal-red.svg,
 * per the Aug 2026 decision to return to the delivered logotype. Four
 * alternates lived behind demo flags until 2026-11-06, when Darius
 * settled on this one.
 *
 * It scales off the container font-size (the `size` classes), so one
 * number tunes it.
 *
 * Accessible name: the SVG image keeps alt='' because both call sites
 * (Header, Footer) wrap the lockup in a Link that carries
 * aria-label='Holiday River Expeditions home'. Standalone use needs the
 * caller to supply an accessible name.
 */
export function Logo({
    // Deliberately arbitrary rather than text-section/text-h2: those tokens
    // carry a line-height. Bare font-size utilities emit no line-height.
    size = 'text-[36px] md:text-[44px]',
    className = '',
}: {
    size?: string;
    className?: string;
}) {
    return (
        <span className={`inline-flex items-center ${size} ${className}`}>
            <Image
                data-logo='classic'
                src='/logo-horizontal-red.svg'
                alt=''
                width={2000}
                height={798}
                className='h-[1em] w-auto'
            />
        </span>
    );
}
