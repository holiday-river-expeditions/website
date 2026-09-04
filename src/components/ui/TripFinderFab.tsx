'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonClasses } from '@/components/ui/Button';

/**
 * Floating site-wide "Find Your Trip" pill — the escape hatch for visitors
 * overwhelmed mid-browse (Aug 20 decision; live for everyone since
 * 2026-09-04). Bottom-LEFT: bottom-center is owned by
 * SectionNav/DepartureFilterBar and bottom-right by the demo-flags panel
 * pill. Hidden on the wizard itself — the only reason this is a client
 * component.
 */
export function TripFinderFab() {
    const pathname = usePathname();
    if (pathname === '/trip-finder') return null;

    return (
        <div className='fixed left-6 z-40 bottom-[max(1.5rem,env(safe-area-inset-bottom))]'>
            <Link
                href='/trip-finder'
                className={buttonClasses({
                    variant: 'primary',
                    size: 'sm',
                    display: 'inline-block',
                    className: 'shadow-lg',
                })}
            >
                Find Your Trip
            </Link>
        </div>
    );
}
