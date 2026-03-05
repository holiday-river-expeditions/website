import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

vi.mock('@/lib/sanity', () => ({
    getHomepage: vi.fn().mockResolvedValue(null),
    getAllRivers: vi.fn().mockResolvedValue([]),
    getFeaturedTrips: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/sanity/image', () => ({
    urlFor: vi.fn(),
}));

import Home from './page';

test('renders the home page', async () => {
    const html = await Home();
    render(html);
    expect(screen.getByText('Holiday River Expeditions')).toBeInTheDocument();
});
