import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
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
        label: 'Pompe n’ Honey',
        note: null,
        tripName: 'Yampa River',
        href: '/trips/yampa#departure-2027-05-15',
        startingPrice: '$1,435',
        departure: departure(),
        image: null,
        ...overrides,
    };
}

function linkLabel(r: SpecialtyDateRow): string | null {
    const { unmount } = render(
        <SpecialtyDateList rows={[r]} fares={new Map()} />,
    );
    const label = screen.getByRole('link').textContent;
    unmount();
    return label;
}

test('says Book when the date has open seats and an online booking link', () => {
    expect(linkLabel(row())).toBe('Book');
});

test('keeps View Trip when the date is full', () => {
    expect(
        linkLabel(row({ departure: departure({ remainingopenings: 0 }) })),
    ).toBe('View Trip');
});

test('keeps View Trip when the date cannot be booked online', () => {
    expect(
        linkLabel(row({ departure: departure({ onlinebookingurl: null }) })),
    ).toBe('View Trip');
});

test('keeps View Trip when Arctic has no matching departure', () => {
    expect(linkLabel(row({ departure: null }))).toBe('View Trip');
});
