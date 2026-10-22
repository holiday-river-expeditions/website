'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { useSectionSpy } from '@/lib/use-section-spy';

export interface SectionNavItem {
    /** id of the target section element (rendered as href="#id"). */
    id: string;
    label: string;
}

/**
 * Section menu for content-heavy pages (Aug 20 decision: trip pages get a
 * scroll-following menu; specialty families get jump links). Reworked Oct
 * 2026 after a heuristic review of the old bottom-centre pill, which sat on
 * the Find Your Trip pill on phones, covered Book buttons and map controls,
 * and hid most specialty families behind a sideways scroll.
 *
 * - Below lg (where the header turns into the hamburger): a dock pinned
 *   to the bottom edge. The left button names the section in view and
 *   opens a sheet listing every section plus Find Your Trip. The optional
 *   CTA on the right jumps to the booking section.
 * - lg and up: a tab row fixed under the top edge, shown once the first
 *   section reaches the upper half of the screen.
 *
 * The active section is an underline or side rule, never a red fill, so
 * red stays reserved for booking. Nothing stays active above the first
 * section or below the last. Page padding for the dock and anchor offsets
 * for the tab row live in globals.css, keyed on [data-section-dock], and
 * TripFinderFab hides on phones while the dock is present.
 *
 * Plain anchors keep jumps working without JS. Smooth scrolling comes from
 * `motion-safe:scroll-smooth` on <html>. z-40 keeps it under the
 * demo-flags overlay (z-[100]).
 */
export function SectionNav({
    items,
    ariaLabel = 'Page sections',
    cta,
    trips = [],
}: {
    items: SectionNavItem[];
    ariaLabel?: string;
    /** Booking jump, e.g. See dates. Hidden while its section is in view. */
    cta?: SectionNavItem;
    /** Similar trips for the sheet, shown under the sheet-trips flag. */
    trips?: { href: string; label: string; detail?: string }[];
}) {
    const { active, started: tabsVisible } = useSectionSpy(
        items.map((item) => item.id),
    );
    const sheetRef = useRef<HTMLDialogElement>(null);
    const swipeStart = useRef<number | null>(null);

    if (items.length === 0) return null;

    const activeLabel =
        items.find((item) => item.id === active)?.label ?? 'On this page';
    const showCta = cta !== undefined && active !== cta.id;
    const closeSheet = () => sheetRef.current?.close();

    return (
        <nav
            aria-label={ariaLabel}
            data-section-dock
            className='[[data-demo-trip-bar=on]_&]:hidden'
        >
            {/* lg and up: tab row */}
            <div
                className={`fixed inset-x-0 top-0 z-40 hidden border-b px-6 border-onyx/15 bg-holiday-white shadow-sm transition-[opacity,translate,top] duration-200 lg:block [[data-demo-sticky-header=on]_&]:top-[var(--site-header-h,7rem)] [[data-demo-header-reveal=on]:not([data-header-hidden])_&]:top-[var(--site-header-h,7rem)] ${
                    tabsVisible
                        ? 'opacity-100'
                        : 'pointer-events-none invisible -translate-y-2 opacity-0'
                }`}
            >
                <div className='mx-auto flex max-w-7xl items-center gap-6'>
                    <ul className='flex gap-6'>
                        {items.map((item) => (
                            <li key={item.id}>
                                <a
                                    href={`#${item.id}`}
                                    aria-current={
                                        active === item.id ? 'true' : undefined
                                    }
                                    className={`flex min-h-12 items-center whitespace-nowrap border-b-2 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em] text-onyx hover:text-holiday-red ${
                                        active === item.id
                                            ? 'border-onyx'
                                            : 'border-transparent'
                                    }`}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    {cta && (
                        <a
                            href={`#${cta.id}`}
                            className={buttonClasses({
                                size: 'sm',
                                className: `ml-auto ${showCta ? '' : 'invisible'}`,
                            })}
                        >
                            {cta.label}
                        </a>
                    )}
                </div>
            </div>

            {/* Below lg: bottom dock */}
            <div className='fixed inset-x-0 bottom-0 z-40 border-t border-onyx/15 bg-holiday-white pb-[env(safe-area-inset-bottom)] lg:hidden'>
                <div className='flex gap-2 p-2'>
                    <button
                        type='button'
                        aria-haspopup='dialog'
                        onClick={() => sheetRef.current?.showModal()}
                        className='flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 border border-onyx/30 px-3 font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em] text-onyx'
                    >
                        <span className='truncate'>{activeLabel}</span>
                        <Chevron className='shrink-0 text-holiday-red' />
                    </button>
                    {cta && showCta && (
                        <a
                            href={`#${cta.id}`}
                            className={buttonClasses({
                                size: 'sm',
                                display: 'flex',
                                className: 'min-h-11 shrink-0 items-center',
                            })}
                        >
                            {cta.label}
                        </a>
                    )}
                </div>
            </div>

            {/* Section sheet. Native <dialog> gives Escape, inert page and
                focus return; backdrop taps and a downward swipe also close
                it. The visual padding sits on the inner div so a click
                whose target is the <dialog> itself is always the backdrop. */}
            <dialog
                ref={sheetRef}
                aria-label={ariaLabel}
                onClick={(event) => {
                    if (event.target === event.currentTarget) closeSheet();
                }}
                onTouchStart={(event) => {
                    swipeStart.current = event.touches[0]?.clientY ?? null;
                }}
                onTouchEnd={(event) => {
                    const end = event.changedTouches[0]?.clientY;
                    if (
                        swipeStart.current !== null &&
                        end !== undefined &&
                        end - swipeStart.current > 60
                    ) {
                        closeSheet();
                    }
                    swipeStart.current = null;
                }}
                className='inset-x-0 bottom-0 top-auto m-0 w-full max-w-none bg-holiday-white text-onyx backdrop:bg-onyx/40 lg:hidden'
            >
                <div className='px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2'>
                    <div
                        aria-hidden
                        className='mx-auto mb-2 h-1 w-10 rounded-full bg-onyx/20'
                    />
                    <div className='flex items-center justify-between'>
                        <p className='font-alt-gothic text-[13px] font-semibold uppercase tracking-[0.08em] text-onyx/75'>
                            On this page
                        </p>
                        <button
                            type='button'
                            aria-label='Close'
                            onClick={closeSheet}
                            className='-mr-2 flex size-11 items-center justify-center text-[22px] leading-none text-onyx'
                        >
                            ×
                        </button>
                    </div>
                    <ul className='mt-1'>
                        {items.map((item) => (
                            <li key={item.id}>
                                <a
                                    href={`#${item.id}`}
                                    onClick={closeSheet}
                                    aria-current={
                                        active === item.id ? 'true' : undefined
                                    }
                                    className={`flex min-h-12 items-center border-l-[3px] pl-3 font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.04em] text-onyx ${
                                        active === item.id
                                            ? 'border-onyx'
                                            : 'border-transparent'
                                    }`}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    {/* sheet-trips demo flag: a way on to a better-fitting
                        trip without going back to the main nav. */}
                    {trips.length > 0 && (
                        <div className='mt-2 hidden border-t border-onyx/15 pt-3 [[data-demo-sheet-trips=on]_&]:block'>
                            <p className='font-alt-gothic text-[13px] font-semibold uppercase tracking-[0.08em] text-onyx/75'>
                                Similar trips
                            </p>
                            <ul className='mt-1'>
                                {trips.slice(0, 3).map((trip) => (
                                    <li key={trip.href}>
                                        <Link
                                            href={trip.href}
                                            onClick={closeSheet}
                                            className='flex min-h-12 flex-col justify-center pl-[15px]'
                                        >
                                            <span className='font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.04em] text-onyx'>
                                                {trip.label}
                                            </span>
                                            {trip.detail && (
                                                <span className='text-[14px] text-onyx/75'>
                                                    {trip.detail}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <Link
                        href='/trip-finder'
                        onClick={closeSheet}
                        className='mt-2 flex min-h-12 items-center border-t border-onyx/15 pl-[15px] font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.04em] text-evergreen'
                    >
                        Find Your Trip
                    </Link>
                </div>
            </dialog>
        </nav>
    );
}

function Chevron({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden
            viewBox='0 0 12 8'
            width='12'
            height='8'
            className={className}
        >
            <path
                d='M1 7 6 2l5 5'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
            />
        </svg>
    );
}
