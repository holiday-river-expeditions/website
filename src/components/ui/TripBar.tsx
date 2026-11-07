'use client';

import Link from 'next/link';
import { useId } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { useSectionSpy } from '@/lib/use-section-spy';

export interface SectionNavItem {
    /** id of the target section element (rendered as href="#id"). */
    id: string;
    label: string;
}

const LABEL =
    'font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em]';
const SHEET_LINK =
    'flex min-h-12 items-center font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.04em]';

/**
 * The section menu for trip pages and the specialty hub: one bar placed in
 * the page under the banner and sticky from there, flush under the sticky
 * site header (Oct 2026, from an NN/g review plus IDEO pass of the old
 * section menu). Default since 2026-11-06, when the trip-bar flag graduated
 * and the old SectionNav dock and tab row were removed.
 *
 * - Left: below `tabsFrom`, a bordered button naming the section in view
 *   that opens the section sheet. From `tabsFrom`, inline section tabs.
 * - Summary (price, next open date) from md up, except lg to xl where the
 *   tabs need the room. On phones it heads the section sheet instead.
 * - Right: See dates, swapped for an outlined Call us of the same width
 *   while the dates section is in view. Pages without a CTA get Find Your
 *   Trip.
 * - The sheet lists the sections, then up to three similar trips (trip
 *   pages, the same ones as Keep Exploring), then Find Your Trip and the
 *   phone number.
 *
 * The sheet is an HTML popover, so it opens, closes on Escape or an outside
 * tap, and keeps its links working without JS. The jump offset is one
 * scroll-padding-top rule in globals.css.
 */
export function TripBar({
    items,
    ariaLabel,
    cta,
    summary = [],
    phone,
    tabsFrom = 'lg',
    trips = [],
}: {
    items: SectionNavItem[];
    ariaLabel: string;
    /** Booking jump, e.g. See dates. */
    cta?: SectionNavItem;
    /** Short facts for the bar and sheet, e.g. From $1,680, Next open May 3. */
    summary?: string[];
    /** Shown in the sheet, and in place of the CTA inside its own section. */
    phone?: { href: string; label: string };
    /** Width where the section button gives way to inline tabs. */
    tabsFrom?: 'lg' | 'xl';
    /** Similar trips for the sheet. Up to three are shown. */
    trips?: { href: string; label: string; detail?: string }[];
}) {
    const id = useId();
    const sectionsId = `${id}-sections`;
    const { active } = useSectionSpy(items.map((item) => item.id));

    if (items.length === 0) return null;

    const activeLabel =
        items.find((item) => item.id === active)?.label ?? 'On this page';
    const inCta = cta !== undefined && active === cta.id;
    const summaryText = summary.join(' · ');
    const hide = (popoverId: string) => () =>
        document.getElementById(popoverId)?.hidePopover?.();
    const atTabs = tabsFrom === 'lg' ? 'lg' : 'xl';

    return (
        <div
            data-trip-bar
            className='sticky top-[var(--site-header-h,5rem)] z-40 border-y border-onyx/15 bg-holiday-white'
        >
            <nav
                aria-label={ariaLabel}
                className='mx-auto flex h-13 max-w-7xl items-center gap-2 px-2 sm:px-6 lg:gap-6'
            >
                <button
                    type='button'
                    popoverTarget={sectionsId}
                    aria-label={`${activeLabel}. Sections on this page`}
                    className={`flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 border border-onyx/30 px-3 text-onyx ${LABEL} ${
                        atTabs === 'lg' ? 'lg:hidden' : 'xl:hidden'
                    }`}
                >
                    <span className='truncate'>{activeLabel}</span>
                    <Chevron className='shrink-0 text-holiday-red' />
                </button>

                <ul
                    className={`hidden min-w-0 flex-1 gap-6 ${
                        atTabs === 'lg' ? 'lg:flex' : 'xl:flex'
                    }`}
                >
                    {items.map((item) => (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                aria-current={
                                    active === item.id ? 'true' : undefined
                                }
                                className={`flex h-13 items-center whitespace-nowrap border-b-2 text-onyx hover:text-holiday-red ${LABEL} ${
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

                {summaryText && (
                    <p className='hidden shrink-0 whitespace-nowrap text-[14px] font-bold text-onyx md:block lg:hidden xl:block'>
                        {summaryText}
                    </p>
                )}

                {cta ? (
                    inCta && phone ? (
                        <a
                            href={phone.href}
                            className={buttonClasses({
                                variant: 'outline',
                                size: 'sm',
                                display: 'flex',
                                className:
                                    'min-h-11 min-w-[7.5rem] shrink-0 items-center justify-center px-4',
                            })}
                        >
                            Call us
                        </a>
                    ) : (
                        <a
                            href={`#${cta.id}`}
                            className={buttonClasses({
                                size: 'sm',
                                display: 'flex',
                                className:
                                    'min-h-11 min-w-[7.5rem] shrink-0 items-center justify-center px-4',
                            })}
                        >
                            {cta.label}
                        </a>
                    )
                ) : (
                    <Link
                        href='/trip-finder'
                        className={buttonClasses({
                            variant: 'evergreen',
                            size: 'sm',
                            display: 'flex',
                            className:
                                'min-h-11 shrink-0 items-center justify-center px-4',
                        })}
                    >
                        Find Your Trip
                    </Link>
                )}
            </nav>

            {/* Section sheet, below `tabsFrom`. */}
            <div
                id={sectionsId}
                popover='auto'
                aria-label='Sections on this page'
                className='inset-x-0 bottom-0 top-auto m-0 max-h-[85vh] w-full max-w-none border-0 bg-holiday-white p-0 text-onyx backdrop:bg-onyx/40'
            >
                <div className='px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3'>
                    <SheetHeader title='On this page' closes={sectionsId} />
                    {summaryText && (
                        <p className='text-[15px] font-bold text-onyx'>
                            {summaryText}
                        </p>
                    )}
                    <ul className='mt-1'>
                        {items.map((item) => (
                            <li key={item.id}>
                                <a
                                    href={`#${item.id}`}
                                    onClick={hide(sectionsId)}
                                    aria-current={
                                        active === item.id ? 'true' : undefined
                                    }
                                    className={`${SHEET_LINK} border-l-[3px] pl-3 text-onyx ${
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
                    {/* A way on to a better-fitting trip without going
                        back to the main nav (the sheet-trips flag until
                        2026-11-06). */}
                    {trips.length > 0 && (
                        <div className='mt-2 border-t border-onyx/15 pt-3'>
                            <p className='font-alt-gothic text-[13px] font-semibold uppercase tracking-[0.08em] text-onyx/75'>
                                Similar trips
                            </p>
                            <ul className='mt-1'>
                                {trips.slice(0, 3).map((trip) => (
                                    <li key={trip.href}>
                                        <Link
                                            href={trip.href}
                                            onClick={hide(sectionsId)}
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
                    <div className='mt-2 border-t border-onyx/15 pl-[15px]'>
                        <Link
                            href='/trip-finder'
                            onClick={hide(sectionsId)}
                            className={`${SHEET_LINK} text-evergreen`}
                        >
                            Find Your Trip
                        </Link>
                        {phone && (
                            <a
                                href={phone.href}
                                className={`${SHEET_LINK} text-onyx`}
                            >
                                Call {phone.label}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SheetHeader({ title, closes }: { title: string; closes: string }) {
    return (
        <div className='flex items-center justify-between'>
            <p className='font-alt-gothic text-[13px] font-semibold uppercase tracking-[0.08em] text-onyx/75'>
                {title}
            </p>
            <button
                type='button'
                popoverTarget={closes}
                popoverTargetAction='hide'
                aria-label='Close'
                className='-mr-2 flex size-11 items-center justify-center text-[22px] leading-none text-onyx'
            >
                ×
            </button>
        </div>
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
                d='M1 1l5 5 5-5'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
            />
        </svg>
    );
}
