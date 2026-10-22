import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { TripBar } from './TripBar';

// Same setup as SectionNav.test: sections laid out by hand, a sync rAF
// that returns 0 so every scroll schedules a fresh frame.
beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) => {
        run(0);
        return 0;
    });
    for (const id of ['trip-details', 'faqs', 'dates-and-rates']) {
        const section = document.createElement('section');
        section.id = id;
        document.body.appendChild(section);
    }
});
afterEach(() => {
    document.querySelectorAll('section').forEach((el) => el.remove());
    vi.unstubAllGlobals();
});

const items = [
    { id: 'trip-details', label: 'Trip Details' },
    { id: 'faqs', label: 'FAQs' },
    { id: 'dates-and-rates', label: 'Dates & Availability' },
];
const cta = { id: 'dates-and-rates', label: 'See dates' };
const phone = { href: 'tel:+18012662087', label: '801-266-2087' };

function scrollTo(y: number) {
    ['trip-details', 'faqs', 'dates-and-rates'].forEach((id, index) => {
        const top = index * 1000 + 500 - y;
        document.getElementById(id)!.getBoundingClientRect = () =>
            ({ top, bottom: top + 800 }) as DOMRect;
    });
    act(() => {
        window.dispatchEvent(new Event('scroll'));
    });
}

test('the section button and the site menu open their popovers', () => {
    render(<TripBar ariaLabel='Trip sections' items={items} cta={cta} />);
    const sections = screen.getByRole('button', {
        name: /Sections on this page/,
    });
    const menu = screen.getByRole('button', { name: 'Site menu' });

    const sheet = document.getElementById(
        sections.getAttribute('popovertarget')!,
    );
    expect(sheet).toHaveAttribute('popover', 'auto');
    expect(
        document.getElementById(menu.getAttribute('popovertarget')!),
    ).toHaveAttribute('popover', 'auto');
});

test('the section button names the section in view', () => {
    render(<TripBar ariaLabel='Trip sections' items={items} cta={cta} />);
    const button = screen.getByRole('button', {
        name: /Sections on this page/,
    });
    expect(button).toHaveTextContent('On this page');
    scrollTo(1300);
    expect(button).toHaveTextContent('FAQs');
});

test('See dates becomes Call us inside the dates section', () => {
    render(
        <TripBar
            ariaLabel='Trip sections'
            items={items}
            cta={cta}
            phone={phone}
        />,
    );
    expect(screen.getByRole('link', { name: 'See dates' })).toHaveAttribute(
        'href',
        '#dates-and-rates',
    );
    scrollTo(2300);
    expect(screen.queryByRole('link', { name: 'See dates' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Call us' })).toHaveAttribute(
        'href',
        'tel:+18012662087',
    );
});

test('the summary shows in the bar and heads the sheet', () => {
    render(
        <TripBar
            ariaLabel='Trip sections'
            items={items}
            cta={cta}
            summary={['From $1,680', 'Next open May 3']}
        />,
    );
    expect(
        screen.getAllByText('From $1,680 · Next open May 3', {
            ignore: false,
        }),
    ).toHaveLength(2);
});

test('the site menu links the main nav, Find Your Trip and Book Now', () => {
    render(<TripBar ariaLabel='Trip sections' items={items} cta={cta} />);
    for (const [name, href] of [
        ['Home', '/'],
        ['Rafting', '/rafting'],
        ['Contact', '/contact'],
        ['Book Now', '/book'],
    ]) {
        expect(
            screen.getByRole('link', { name, hidden: true }),
        ).toHaveAttribute('href', href);
    }
    expect(
        screen.getAllByRole('link', { name: 'Find Your Trip', hidden: true }),
    ).not.toHaveLength(0);
});

test('a page with no CTA gets Find Your Trip on the right', () => {
    render(<TripBar ariaLabel='Families' items={items} tabsFrom='xl' />);
    expect(screen.queryByRole('link', { name: 'See dates' })).toBeNull();
    const findLinks = screen.getAllByRole('link', {
        name: 'Find Your Trip',
        hidden: true,
    });
    expect(
        findLinks.some((link) => link.className.includes('bg-evergreen')),
    ).toBe(true);
});

test('the site menu slides in only while the site header is off screen', () => {
    let report: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            constructor(callback: IntersectionObserverCallback) {
                report = callback;
            }
            observe() {}
            disconnect() {}
        },
    );
    const header = (visible: boolean) =>
        act(() =>
            report(
                [{ isIntersecting: visible } as IntersectionObserverEntry],
                {} as IntersectionObserver,
            ),
        );
    render(
        <>
            <header data-site-header />
            <TripBar ariaLabel='Trip sections' items={items} cta={cta} />
        </>,
    );
    const slot = () =>
        screen.getByRole('button', { name: 'Site menu' }).parentElement!;

    header(true);
    expect(slot()).toHaveAttribute('inert');
    header(false);
    expect(slot()).not.toHaveAttribute('inert');
});
