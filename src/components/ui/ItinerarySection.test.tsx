import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { ItinerarySection } from './ItinerarySection';

const days = [
    {
        _key: 'a',
        day: 'Day 1',
        title: 'Put-in',
        description: 'Rig and launch.',
    },
    { _key: 'b', day: 'Day 2', title: 'Big water', description: 'Rapids.' },
];

test('renders nothing when the trip has no itinerary', () => {
    const { container } = render(<ItinerarySection days={[]} />);
    expect(container).toBeEmptyDOMElement();
});

test('renders the day accordions on the rapids band', () => {
    const { container } = render(<ItinerarySection days={days} />);

    expect(
        screen.getByRole('heading', { level: 2, name: /a day on the river/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Put-in')).toBeInTheDocument();
    expect(container.querySelector('.bg-canvas')).not.toBeNull();
});
