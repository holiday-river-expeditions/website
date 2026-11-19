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
