/**
 * Anchor for links that leave the site: opens in a new tab with a visible
 * arrow-out cue and screen-reader text, so the context switch is never a
 * surprise (NN/g: user control & freedom).
 */
export function ExternalLink({
    href,
    className = '',
    children,
}: {
    href: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className={`inline-flex items-center gap-1.5 ${className}`}
        >
            {children}
            <svg
                aria-hidden
                width='11'
                height='11'
                viewBox='0 0 12 12'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.6'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='shrink-0'
            >
                <path d='M4 2h6v6' />
                <path d='M10 2 3.5 8.5' />
                <path d='M8 7v3.5H1.5V4H5' />
            </svg>
            <span className='sr-only'>(opens in new tab)</span>
        </a>
    );
}
