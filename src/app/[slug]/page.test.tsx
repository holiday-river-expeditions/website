import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

// CMS-driven page is a server component reading from Sanity. Mock the data
// layer so the test renders deterministic content without hitting the network.
vi.mock('@/lib/sanity', () => ({
    getPageBySlug: vi.fn(async (slug: string) => {
        if (slug !== 'about') return null;
        return {
            _id: 'page-about',
            title: 'About Holiday',
            slug: { current: 'about' },
            content: [
                {
                    _key: 'hero',
                    _type: 'heroBlock',
                    heading: 'Our Story',
                    subheading: 'Rafting since 1966',
                    backgroundImage: null,
                    ctaText: 'Browse Trips',
                    ctaLink: '/trips',
                },
                {
                    _key: 'body',
                    _type: 'contentBlock',
                    heading: 'The Holiday Way',
                    body: [
                        {
                            _key: 'p1',
                            _type: 'block',
                            style: 'normal',
                            children: [
                                {
                                    _key: 's1',
                                    _type: 'span',
                                    text: 'Dee Holladay founded the company with a simple idea.',
                                    marks: [],
                                },
                            ],
                            markDefs: [],
                        },
                    ],
                },
            ],
        };
    }),
    imageUrl: () => '',
}));

// next/navigation's notFound throws; stub it so we can assert it fired.
const notFoundMock = vi.hoisted(() =>
    vi.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
);
vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import CmsPage from './page';

function props(slug: string) {
    return { params: Promise.resolve({ slug }) };
}

test('renders hero and content blocks for a CMS page', async () => {
    render(await CmsPage(props('about')));

    expect(
        screen.getByRole('heading', { level: 1, name: /our story/i }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('heading', { level: 2, name: /the holiday way/i }),
    ).toBeInTheDocument();
    expect(
        screen.getByText(/dee holladay founded the company/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse trips/i })).toHaveAttribute(
        'href',
        '/trips',
    );
});

test('404s for a slug with no page document', async () => {
    await expect(CmsPage(props('no-such-page'))).rejects.toThrow(
        'NEXT_NOT_FOUND',
    );
});

test('404s for reserved slugs owned by static routes', async () => {
    await expect(CmsPage(props('trips'))).rejects.toThrow('NEXT_NOT_FOUND');
});
