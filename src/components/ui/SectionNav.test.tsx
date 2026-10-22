import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { SectionNav } from './SectionNav';

// jsdom has no layout, so tests place the sections by hand (viewport
// tops and bottoms in px) and fire a scroll. jsdom's innerHeight is 768,
// which puts the reading line at about 307px.
beforeEach(() => {
    // Runs the frame at once. Returning 0 tells SectionNav no frame is
    // pending, so the next scroll schedules another.
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

/** Lays the three sections out 1000px apart, scrolled by `y`. */
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

test('links every section from both the tab row and the sheet', () => {
    render(<SectionNav items={items} />);
    for (const item of items) {
        const links = screen.getAllByRole('link', {
            name: item.label,
            hidden: true,
        });
        expect(links).toHaveLength(2);
        links.forEach((link) =>
            expect(link).toHaveAttribute('href', `#${item.id}`),
        );
    }
});

test('the sheet offers Find Your Trip', () => {
    render(<SectionNav items={items} />);
    expect(
        screen.getByRole('link', { name: 'Find Your Trip', hidden: true }),
    ).toHaveAttribute('href', '/trip-finder');
});

test('the dock button names the section in view and opens the sheet', () => {
    const showModal = vi.fn();
    HTMLDialogElement.prototype.showModal = showModal;
    render(<SectionNav items={items} ariaLabel='Trip sections' />);

    const button = screen.getByRole('button', { name: 'On this page' });
    scrollTo(1300);
    expect(button).toHaveTextContent('FAQs');

    fireEvent.click(button);
    expect(showModal).toHaveBeenCalledOnce();
});

test('the highlight clears above the first section and past the last', () => {
    render(<SectionNav items={items} />);
    const button = screen.getByRole('button', { name: 'On this page' });

    scrollTo(0);
    expect(button).toHaveTextContent('On this page');
    scrollTo(300);
    expect(button).toHaveTextContent('Trip Details');
    scrollTo(2300);
    expect(button).toHaveTextContent('Dates & Availability');
    scrollTo(3300);
    expect(button).toHaveTextContent('On this page');
});

test('a jump that skips sections still lands on the right state', () => {
    render(<SectionNav items={items} />);
    const button = screen.getByRole('button', { name: 'On this page' });
    scrollTo(1300);
    scrollTo(5000);
    expect(button).toHaveTextContent('On this page');
});

test('the gap after a section keeps it highlighted', () => {
    render(<SectionNav items={items} />);
    const button = screen.getByRole('button', { name: 'On this page' });
    // FAQs runs 1500 to 2300 in page space and the next section starts at
    // 2500, so a reading line at 2400 sits in the gap.
    scrollTo(2400 - 307);
    expect(button).toHaveTextContent('FAQs');
});

test('the CTA hides while its own section is in view', () => {
    render(<SectionNav items={items} cta={cta} />);
    const dockCta = () =>
        screen
            .queryAllByRole('link', { name: 'See dates', hidden: true })
            .filter((link) => !link.className.includes('ml-auto'));

    expect(dockCta()).toHaveLength(1);
    expect(dockCta()[0]).toHaveAttribute('href', '#dates-and-rates');
    scrollTo(2300);
    expect(dockCta()).toHaveLength(0);
});

test('the sheet lists similar trips when given them', () => {
    render(
        <SectionNav
            items={items}
            trips={[
                {
                    href: '/trips/westwater-canyon',
                    label: 'Westwater Canyon',
                    detail: 'Colorado River',
                },
                { href: '/trips/the-maze', label: 'The Maze' },
            ]}
        />,
    );
    expect(
        screen.getByRole('link', { name: /Westwater Canyon/, hidden: true }),
    ).toHaveAttribute('href', '/trips/westwater-canyon');
    expect(
        screen.getByRole('link', { name: /The Maze/, hidden: true }),
    ).toHaveAttribute('href', '/trips/the-maze');
});

test('renders nothing with no items', () => {
    const { container } = render(<SectionNav items={[]} />);
    expect(container).toBeEmptyDOMElement();
});
