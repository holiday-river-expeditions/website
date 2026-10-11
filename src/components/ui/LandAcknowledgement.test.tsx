import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { LandAcknowledgement } from './LandAcknowledgement';

const body = [
    {
        _type: 'block',
        _key: 'a',
        style: 'normal',
        children: [
            {
                _type: 'span',
                _key: 'a1',
                text: 'Cataract Canyon is the traditional homeland of the Ute people.',
            },
        ],
    },
    { _type: 'divider', _key: 'b', style: 'line' },
];

test('renders nothing until the trip has an acknowledgement', () => {
    const { container: empty } = render(<LandAcknowledgement body={[]} />);
    expect(empty).toBeEmptyDOMElement();

    const { container: missing } = render(<LandAcknowledgement body={null} />);
    expect(missing).toBeEmptyDOMElement();
});

test('renders the boxed acknowledgement with its rule', () => {
    const { container } = render(<LandAcknowledgement body={body} />);

    expect(
        screen.getByRole('complementary', { name: /land acknowledgement/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/traditional homeland/)).toBeInTheDocument();
    expect(container.querySelector('hr')).not.toBeNull();
});
