'use client';

import { usePathname } from 'next/navigation';

interface SiteFrameProps {
    /** RevealObserver, the trip-finder pill and the demo panel. */
    chrome: React.ReactNode;
    header: React.ReactNode;
    footer: React.ReactNode;
    children: React.ReactNode;
}

/**
 * The frame around every page. The Studio at /studio is a full-viewport
 * app of its own, and wrapping it in the header and footer gave it a
 * second scrollbar that hid the Publish button (Darius, Sep 22), so it
 * renders bare. Header and Footer stay server components; the root layout
 * passes them in as props.
 */
export function SiteFrame({
    chrome,
    header,
    footer,
    children,
}: SiteFrameProps) {
    const pathname = usePathname();
    const isStudio = pathname === '/studio' || pathname.startsWith('/studio/');
    if (isStudio) return <>{children}</>;

    return (
        <>
            {chrome}
            {header}
            <main className='min-h-screen'>{children}</main>
            {footer}
        </>
    );
}
