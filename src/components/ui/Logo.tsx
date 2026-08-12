import Image from 'next/image';

/**
 * Single-line logo lockup: the boat/waves/oar mark with the wordmark run
 * horizontally beside it, type sized so the caps match the mark's height
 * (per design direction — the wrapped three-line lockup felt heavy).
 *
 * Everything scales off the container font-size (the `size` classes), so
 * one number tunes the whole lockup: icon is 1em tall, text ~1.32em
 * (Alternate Gothic caps sit at ~72% of em, so 1.32em ≈ cap height 1em).
 */
export function Logo({
    size = 'text-[36px] md:text-[44px]',
    color = 'text-holiday-red',
    className = '',
}: {
    /** Tailwind text-size classes; the em base everything scales from. */
    size?: string;
    color?: string;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-[0.32em] ${size} ${className}`}
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
    );
}
