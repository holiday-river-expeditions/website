import { render, screen } from '@testing-library/react';
import { beforeAll, expect, test, vi } from 'vitest';
import { SectionNav } from './SectionNav';

// jsdom has no IntersectionObserver; the active-section highlight simply
// stays off in tests.
beforeAll(() => {
    vi.stubGlobal(
        'IntersectionObserver',
        vi.fn(() => ({
            observe: vi.fn(),
            disconnect: vi.fn(),
        })),
    );
});

const items = [
    { id: 'trip-details', label: 'Trip Details' },
    { id: 'dates-and-rates', label: 'Rates & Dates' },
];

test('renders an anchor per section', () => {
    render(<SectionNav items={items} showAfter={0} />);
    expect(screen.getByRole('link', { name: 'Trip Details' })).toHaveAttribute(
        'href',
        '#trip-details',
    );
    expect(screen.getByRole('link', { name: 'Rates & Dates' })).toHaveAttribute(
        'href',
        '#dates-and-rates',
    );
});

test('is visible immediately when showAfter is 0', () => {
    render(<SectionNav items={items} showAfter={0} ariaLabel='Families' />);
    expect(
        screen.getByRole('navigation', { name: 'Families' }),
    ).not.toHaveClass('invisible');
});

test('starts hidden when a scroll threshold is set', () => {
    render(<SectionNav items={items} ariaLabel='Trip sections' />);
    expect(
        screen.getByRole('navigation', { name: 'Trip sections' }),
    ).toHaveClass('invisible');
});

test('renders nothing with no items', () => {
    const { container } = render(<SectionNav items={[]} />);
    expect(container).toBeEmptyDOMElement();
});
