import Image from 'next/image';

/**
 * Logo lockup: the boat/waves/oar mark with the wordmark beside it.
 *
 * Two arrangements, both scaling entirely off the container font-size
 * (the `size` classes) so one number tunes the whole lockup:
 *  - 'line':   HOLIDAY RIVER EXPEDITIONS on one line, caps at mark height
 *              (icon 1em, text 1.32em ≈ cap height 1em).
 *  - 'stack':  HOLIDAY RIVER / EXPEDITIONS on two lines, text block matched
 *              to mark height — the middle ground between the original
 *              three-line wrap and the full single line.
 */
export function Logo({
    variant = 'stack',
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
    );
}
