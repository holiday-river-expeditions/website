'use client';

import Link from 'next/link';
import { useId, useSyncExternalStore } from 'react';
import { navItems } from '@/components/layout/Nav';
import { buttonClasses } from '@/components/ui/Button';
import type { SectionNavItem } from '@/components/ui/SectionNav';
import { useSectionSpy } from '@/lib/use-section-spy';

const LABEL =
    'font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.04em]';
const SHEET_LINK =
    'flex min-h-12 items-center font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.04em]';

/**
 * trip-bar demo flag: one bar for trip pages and the specialty hub, placed
 * in the page under the banner and sticky from there (Oct 2026, from an
 * NN/g review plus IDEO pass of the section menu). It never morphs the site
 * header, never hides, and replaces SectionNav's dock and tab row while the
 * flag is on.
 *
 * - Left: the site menu (☰), so the main nav is one tap away mid-page. It
 *   only shows while the site header is off screen, sliding in as the
 *   header leaves, so the page never offers two copies of the same menu
 *   (on load, or under the sticky-header and header-reveal flags).
 * - Middle: below `tabsFrom`, a bordered button naming the section in view
 *   that opens the section sheet. From `tabsFrom`, inline section tabs.
 * - Summary (price, next open date) from md up, except lg to xl where the
 *   tabs need the room. On phones it heads the section sheet instead.
 * - Right: See dates, swapped for an outlined Call us of the same width
 *   while the dates section is in view. Pages without a CTA get Find Your
 *   Trip.
 *
 * Both menus are HTML popovers, so they open, close on Escape or an outside
 * tap, and keep their links working without JS. The jump offset is one
 * scroll-padding-top rule in globals.css.
 */
export function TripBar({
    items,
    ariaLabel,
    cta,
    summary = [],
    phone,
    tabsFrom = 'lg',
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
}) {
    const id = useId();
    const menuId = `${id}-menu`;
    const sectionsId = `${id}-sections`;
    const { active } = useSectionSpy(items.map((item) => item.id));
    const headerInView = useHeaderInView();

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
            className='sticky top-0 z-40 hidden border-y border-onyx/15 bg-holiday-white transition-[top] duration-200 [[data-demo-trip-bar=on]_&]:block [[data-demo-sticky-header=on]_&]:top-[var(--site-header-h,7rem)] [[data-demo-header-reveal=on]:not([data-header-hidden])_&]:top-[var(--site-header-h,7rem)]'
        >
            <nav
                aria-label={ariaLabel}
                className='mx-auto flex h-13 max-w-7xl items-center gap-2 px-2 sm:px-6 lg:gap-6'
            >
                {/* The negative right margin cancels the flex gap while the
                    slot is collapsed. */}
                <span
                    inert={headerInView}
                    className={`flex shrink-0 overflow-hidden transition-[max-width,opacity,margin] duration-200 motion-reduce:transition-none ${
                        headerInView
                            ? 'pointer-events-none -mr-2 max-w-0 opacity-0 lg:-mr-6'
                            : '-ml-1 max-w-40 opacity-100'
                    }`}
                >
                    <button
                        type='button'
                        popoverTarget={menuId}
                        aria-label='Site menu'
                        className={`flex size-11 shrink-0 items-center justify-center gap-2 text-onyx md:w-auto md:px-2 ${LABEL}`}
                    >
                        <Burger />
                        <span aria-hidden className='hidden md:inline'>
                            Menu
                        </span>
                    </button>
                </span>

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

            {/* Site menu, every width. */}
            <div
                id={menuId}
                popover='auto'
                aria-label='Site menu'
                className='inset-y-0 left-0 right-auto m-0 h-full max-h-none w-80 max-w-[85vw] border-0 bg-holiday-white p-0 text-onyx backdrop:bg-onyx/40'
            >
                <div className='px-5 pt-3'>
                    <SheetHeader title='Menu' closes={menuId} />
                    <ul>
                        <li>
                            <Link
                                href='/'
                                onClick={hide(menuId)}
                                className={`${SHEET_LINK} text-onyx`}
                            >
                                Home
                            </Link>
                        </li>
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={hide(menuId)}
                                    className={`${SHEET_LINK} text-onyx`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className='mt-4 flex flex-col items-start gap-3 border-t border-onyx/15 pt-4'>
                        <Link
                            href='/trip-finder'
                            onClick={hide(menuId)}
                            className={buttonClasses({ variant: 'evergreen' })}
                        >
                            Find Your Trip
                        </Link>
                        <Link
                            href='/book'
                            onClick={hide(menuId)}
                            className={buttonClasses()}
                        >
                            Book Now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Whether the site header is on screen, read through an
 * IntersectionObserver. The server snapshot is true, which matches a page
 * loaded at the top. A page without the header (tests, the Studio) reads
 * false so the bar's own menu shows. The -1px top margin makes a header
 * slid fully out by header-reveal count as gone, not edge-adjacent.
 */
let headerVisible = true;

function subscribeHeader(onChange: () => void) {
    const header = document.querySelector('header[data-site-header]');
    if (!header || typeof IntersectionObserver === 'undefined') {
        headerVisible = false;
        onChange();
        return () => {};
    }
    const observer = new IntersectionObserver(
        ([entry]) => {
            headerVisible = entry.isIntersecting;
            onChange();
        },
        { rootMargin: '-1px 0px 0px 0px' },
    );
    observer.observe(header);
    return () => observer.disconnect();
}

function useHeaderInView(): boolean {
    return useSyncExternalStore(
        subscribeHeader,
        () =>
            document.querySelector('header[data-site-header]') !== null &&
            headerVisible,
        () => true,
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

function Burger() {
    return (
        <svg aria-hidden viewBox='0 0 20 14' width='20' height='14'>
            <path
                d='M0 1h20M0 7h20M0 13h20'
                stroke='currentColor'
                strokeWidth='2'
            />
        </svg>
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
