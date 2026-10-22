/**
 * Shared chrome for the site's floating bars, now only the trip/specialty
 * section menu (SectionNav). /book's filter bar moved into the page
 * (Oct 2026), so it no longer docks here.
 *
 * Bottom-centre by default; the `bars-top` demo flag docks them under the
 * header instead, clearing the sticky header when that flag is on too.
 */
export const FLOATING_BAR_POSITION =
    'fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transition-opacity duration-200 [[data-demo-bars-top=on]_&]:bottom-auto [[data-demo-bars-top=on]_&]:top-4 [[data-demo-bars-top=on][data-demo-sticky-header=on]_&]:top-28';

/** Lauren, Sep 3: the menu needed a border. */
export const FLOATING_BAR_CHROME =
    'border-2 border-onyx/25 bg-holiday-white shadow-lg';

export function floatingBarClasses(visible: boolean): string {
    return `${FLOATING_BAR_POSITION} ${
        visible ? 'opacity-100' : 'pointer-events-none invisible opacity-0'
    }`;
}
