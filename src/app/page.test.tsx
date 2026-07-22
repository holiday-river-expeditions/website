import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

// The homepage is a server component that reads from Sanity. Mock the data layer
// so the test renders deterministic content without hitting the network.
vi.mock('@/lib/sanity', () => ({
    getHomepage: vi.fn(async () => ({
        heroHeading:
            'Multi-Day Raft and Bike Expeditions in the Heart of Canyon Country',
        heroImage: null,
        featuredTrips: [
            {
                _id: 'trip-cataract-canyon',
                name: 'Cataract Canyon',
                slug: { current: 'cataract-canyon' },
                tagline:
                    'Legendary whitewater through the heart of Canyonlands National Park.',
                subtitle: null,
                ribbon: null,
                startingPrice: '$1,630',
                durationLabel: '5/6 Days',
                category: 'Whitewater Rafting',
                image: null,
            },
        ],
        storyBody:
            'From the Holiday family to all of our guests over the decades: Thank you!',
        storyImageLeft: null,
        storyImagePortrait: null,
        storyCtaText: 'Learn More',
        storyCtaLink: '/about',
        rivers: [],
        learnContent: [],
    })),
    // Not exercised when images are null, but the import must resolve.
    urlFor: () => ({
        width: () => ({
            fit: () => ({
                auto: () => ({
                    height: () => ({ url: () => '' }),
                    url: () => '',
                }),
            }),
        }),
    }),
}));

import Home from './page';

test('renders the home page with the hero headline and key sections', async () => {
    render(await Home());

    // Hero headline (from Sanity)
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

    // Rafting Since 1966 section
    expect(
        screen.getByRole('heading', {
            level: 2,
            name: /rafting\s*since\s*1966/i,
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
