import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import Home from './page';

test('renders the home page with the hero headline and key sections', () => {
    render(Home());

    // Hero headline
    expect(
        screen.getByRole('heading', {
            level: 1,
            name: /multi-day raft and bike expeditions/i,
        }),
    ).toBeInTheDocument();

    // Trip grid — a featured trip name
    expect(
        screen.getByRole('heading', { level: 3, name: /cataract canyon/i }),
    ).toBeInTheDocument();

    // Motor-Free Since 1966 section
    expect(
        screen.getByRole('heading', {
            level: 2,
            name: /motor-free rafting/i,
        }),
    ).toBeInTheDocument();

    // Learn & Get Inspired section
    expect(
        screen.getByRole('heading', {
            level: 2,
            name: /learn & get inspired/i,
        }),
    ).toBeInTheDocument();
});
