import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import type { ArcticDeparture } from '@/lib/arctic';
import { buildCalloutMap } from '@/lib/departures';
import { DepartureList } from './DepartureList';

function departure(overrides: Partial<ArcticDeparture> = {}): ArcticDeparture {
    return {
        id: 1,
        triptypeid: 37,
        name: 'Desolation Canyon 5 day',
        start: '2026-09-12',
        starttime: null,
        canceled: false,
        openings: 20,
        remainingopenings: 10,
        duration: '120:00:00',
        guests: 0,
        onlinebookingurl: 'https://example.com/reserve',
        ...overrides,
    };
}

/** The row <li> containing a given date label. */
function rowFor(container: HTMLElement, dateLabel: string): HTMLElement {
    const row = [...container.querySelectorAll('li')].find((li) =>
        li.textContent?.includes(dateLabel),
    );
    if (!row) throw new Error(`no row for ${dateLabel}`);
    return row;
}

test('renders no callout when none is supplied', () => {
    const { container } = render(<DepartureList departures={[departure()]} />);
    expect(container.querySelector('a[href^="/specialty"]')).toBeNull();
});

test('badges only the departure whose start date is called out', () => {
    const departures = [
        departure({ id: 1, start: '2026-09-12' }),
        departure({ id: 2, start: '2026-09-19' }),
    ];
    const callouts = buildCalloutMap([
        {
            startDate: '2026-09-12',
            label: 'With The Pickpockets',
            note: 'Two sets on the beach.',
            specialtyType: { slug: { current: 'canyon-concerts' } },
        },
    ]);

    const { container } = render(
        <DepartureList departures={departures} callouts={callouts} />,
    );

    const called = rowFor(container, 'Sep 12');
    const link = within(called).getByRole('link', {
        name: 'With The Pickpockets',
    });
    expect(link).toHaveAttribute('href', '/specialty#canyon-concerts');
    expect(within(called).getByText('Two sets on the beach.')).toBeVisible();

    // The neighbouring departure stays untouched.
    const other = rowFor(container, 'Sep 19');
    expect(within(other).queryByText('With The Pickpockets')).toBeNull();
});

test('renders a plain badge when the callout has no linked family', () => {
    const callouts = buildCalloutMap([
        { startDate: '2026-09-12', label: 'New Moon' },
    ]);
    const { container } = render(
        <DepartureList departures={[departure()]} callouts={callouts} />,
    );

    expect(screen.getByText('New Moon')).toBeVisible();
    expect(container.querySelector('a[href^="/specialty"]')).toBeNull();
});

test('a callout does not displace the seats badge', () => {
    const callouts = buildCalloutMap([
        { startDate: '2026-09-12', label: 'New Moon' },
    ]);
    const { container } = render(
        <DepartureList
            departures={[departure({ remainingopenings: 3 })]}
            callouts={callouts}
        />,
    );

    // Seats text spans several text nodes, so assert on the row as a whole.
    const row = rowFor(container, 'Sep 12');
    expect(screen.getByText('New Moon')).toBeVisible();
    expect(row.textContent).toContain('3 seats left');
});
