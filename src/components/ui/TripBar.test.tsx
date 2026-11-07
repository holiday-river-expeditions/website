import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { TripBar } from './TripBar';

// Sections laid out by hand, and a sync rAF that returns 0 so every
// scroll schedules a fresh frame.
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

test('the section button opens the section sheet popover', () => {
    render(<TripBar ariaLabel='Trip sections' items={items} cta={cta} />);
    const sections = screen.getByRole('button', {
        name: /Sections on this page/,
    });
    const sheet = document.getElementById(
        sections.getAttribute('popovertarget')!,
    );
    expect(sheet).toHaveAttribute('popover', 'auto');
});

test('there is no site menu, since the sticky header always shows', () => {
    render(<TripBar ariaLabel='Trip sections' items={items} cta={cta} />);
    expect(
        screen.queryByRole('button', { name: 'Site menu', hidden: true }),
    ).toBeNull();
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

test('the sheet lists up to three similar trips', () => {
    const trips = ['Yampa', 'Desolation', 'Westwater', 'Cataract'].map(
        (name) => ({
            href: `/trips/${name.toLowerCase()}`,
            label: name,
            detail: 'Green River · 5 Days',
        }),
    );
    render(
        <TripBar
            ariaLabel='Trip sections'
            items={items}
            cta={cta}
            trips={trips}
        />,
    );
    expect(screen.getByText('Similar trips')).toBeInTheDocument();
    for (const name of ['Yampa', 'Desolation', 'Westwater']) {
        expect(
            screen.getByRole('link', { name: new RegExp(name), hidden: true }),
        ).toHaveAttribute('href', `/trips/${name.toLowerCase()}`);
    }
    expect(
        screen.queryByRole('link', { name: /Cataract/, hidden: true }),
    ).toBeNull();
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
