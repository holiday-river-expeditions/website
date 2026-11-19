import { render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import type { ArcticDeparture } from '@/lib/arctic';
import type { SpecialtyDateRow } from '@/lib/departures';
import { SpecialtyDateList } from './SpecialtyDateList';

// The real module builds a Sanity client at import, which needs env vars.
vi.mock('@/lib/sanity', () => ({ imageUrl: () => '' }));

function departure(overrides: Partial<ArcticDeparture> = {}): ArcticDeparture {
    return {
        id: 1,
        triptypeid: 59,
        name: 'Yampa River 4 day',
        start: '2027-05-15',
        starttime: null,
        canceled: false,
        openings: 20,
        remainingopenings: 10,
        duration: '96:00:00',
        guests: 0,
        onlinebookingurl: 'https://example.com/reserve',
        ...overrides,
    };
}

function row(overrides: Partial<SpecialtyDateRow> = {}): SpecialtyDateRow {
    return {
        key: 'yampa-2027-05-15',
        startDate: '2027-05-15',
        label: 'Pompe & Honey',
        note: null,
        tripName: 'Yampa River',
        href: '/specialty/pompe-and-honey-yampa-2027-05-15',
        startingPrice: '$1,435',
        phoneOnly: false,
        priceText: null,
        lengthText: null,
        departure: departure(),
        image: null,
        ...overrides,
    };
}

const PAGE = '/specialty/pompe-and-honey-yampa-2027-05-15';

function renderRow(r: SpecialtyDateRow) {
    return render(<SpecialtyDateList rows={[r]} fares={new Map()} />);
}

afterEach(() => {
    vi.unstubAllEnvs();
});

test('the name links to the date page', () => {
    renderRow(row());
    expect(screen.getByRole('link', { name: 'Pompe & Honey' })).toHaveAttribute(
        'href',
        PAGE,
    );
});

test('Book opens Arctic for an open date, in one click', () => {
    renderRow(row());
    const book = screen.getByRole('link', { name: /^Book/ });
    expect(book).toHaveAttribute('href', 'https://example.com/reserve');
    expect(book).toHaveAttribute('target', '_blank');
});

test('Book opens the booking panel in the row when native booking is on', () => {
    vi.stubEnv('BOOKING_NATIVE', 'true');
    renderRow(row());
    const book = screen.getByRole('button', { name: 'Book' });
    expect(book).toHaveAttribute('aria-expanded', 'false');
    // No Book link that would leave the page.
    expect(screen.queryByRole('link', { name: /^Book/ })).toBeNull();
});

test.each([
    ['the date is full', { departure: departure({ remainingopenings: 0 }) }],
    [
        'the date cannot be booked online',
        { departure: departure({ onlinebookingurl: null }) },
    ],
    ['Arctic has no matching departure', { departure: null }],
])('shows View Trip to the date page when %s', (_name, overrides) => {
    renderRow(row(overrides));
    expect(screen.queryByRole('link', { name: /^Book/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'View Trip' })).toHaveAttribute(
        'href',
        PAGE,
    );
});

test('a price and length typed for the date win over Arctic’s', () => {
    render(
        <SpecialtyDateList
            rows={[row({ priceText: '$890', lengthText: '3 Days' })]}
            fares={new Map([[59, '$1,560']])}
        />,
    );
    expect(screen.getByText(/\$890/)).toBeInTheDocument();
    expect(screen.queryByText(/Starts at/)).toBeNull();
    expect(screen.queryByText(/\$1,560/)).toBeNull();
    expect(screen.getByText('3 Days')).toBeInTheDocument();
    expect(screen.queryByText('4 days')).toBeNull();
});

test('shows Arctic’s fare and length when nothing is typed for the date', () => {
    render(
        <SpecialtyDateList rows={[row()]} fares={new Map([[59, '$1,560']])} />,
    );
    expect(screen.getByText(/Starts at \$1,560/)).toBeInTheDocument();
    expect(screen.getByText('4 days')).toBeInTheDocument();
});

test('a phone-only date shows its own price and View Trip, never Book', () => {
    renderRow(
        row({
            departure: null,
            phoneOnly: true,
            priceText: '$890',
            lengthText: '3 Days',
        }),
    );
    expect(screen.getByText(/\$890/)).toBeInTheDocument();
    expect(screen.getByText('3 Days')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Book/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'View Trip' })).toBeInTheDocument();
});

test('falls back to the trip’s starting price with no match and no override', () => {
    renderRow(row({ departure: null }));
    expect(screen.getByText(/Starts at \$1,435/)).toBeInTheDocument();
});
