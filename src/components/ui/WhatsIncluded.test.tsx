import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { WhatsIncluded } from './WhatsIncluded';

test('renders nothing when there is no list', () => {
    const { container } = render(<WhatsIncluded items={[]} />);
    expect(container).toBeEmptyDOMElement();
});

test('renders the checklist under a heading', () => {
    render(<WhatsIncluded items={['Guide services', 'Meals']} />);

    expect(
        screen.getByRole('heading', { level: 2, name: /what’s included/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Meals')).toBeInTheDocument();
});
