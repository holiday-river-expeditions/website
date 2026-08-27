import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

// The trip finder is a server component reading Sanity (catalog) and Arctic
// (availability). Mock both layers so tests render deterministically.
const trips = [
    {
        _id: 'trip-cataract',
        name: 'Cataract Canyon',
        slug: { _type: 'slug', current: 'cataract-canyon' },
        tagline: 'Legendary whitewater.',
        subtitle: null,
        ribbon: null,
        startingPrice: '$1,630',
        durationLabel: '5/6 Days',
        duration: 6,
        minAge: 8,
        minAgeOverrides: [
            { months: [5, 6], minAge: 16, reason: 'spring high water' },
        ],
        maxRapidClass: 4,
        seasonMonths: [5, 6, 7, 8, 9],
        craftTypes: ['oar-raft', 'paddle-raft', 'inflatable-kayak'],
        arcticTripId: '37,38',
        river: {
            name: 'Cataract',
            slug: { _type: 'slug', current: 'cataract' },
        },
        activities: [
            {
                name: 'River Rafting',
                slug: { _type: 'slug', current: 'rafting' },
            },
        ],
        category: 'Whitewater Rafting',
        image: null,
    },
    {
        _id: 'trip-lodore',
        name: 'Gates of Lodore',
        slug: { _type: 'slug', current: 'gates-of-lodore' },
        tagline: 'Family favorite.',
        subtitle: null,
        ribbon: null,
        startingPrice: '$1,300',
        durationLabel: '4 Days',
        duration: 4,
        minAge: 7,
        minAgeOverrides: null,
        maxRapidClass: 3,
        seasonMonths: [5, 6, 7, 8, 9],
        craftTypes: ['oar-raft', 'paddle-raft', 'inflatable-kayak'],
        arcticTripId: '66,46',
        river: {
            name: 'Green River',
            slug: { _type: 'slug', current: 'lodore' },
        },
        activities: [
            {
                name: 'River Rafting',
                slug: { _type: 'slug', current: 'rafting' },
            },
        ],
        category: 'Whitewater Rafting',
        image: null,
    },
    {
        _id: 'trip-maze',
        name: 'The Maze',
        slug: { _type: 'slug', current: 'the-maze' },
        tagline: 'Backcountry biking.',
        subtitle: null,
        ribbon: null,
        startingPrice: '$1,415',
        durationLabel: '5 Days',
        duration: 5,
        minAge: 10,
        minAgeOverrides: null,
        maxRapidClass: null,
        seasonMonths: [4, 5, 9, 10],
        craftTypes: null,
        arcticTripId: '47,48',
        river: { name: 'Maze', slug: { _type: 'slug', current: 'maze' } },
        activities: [
            {
                name: 'Mountain Biking',
                slug: { _type: 'slug', current: 'biking' },
            },
        ],
        category: 'Mountain Biking',
        image: null,
    },
];

vi.mock('@/lib/sanity', () => ({
    getTripFinderTrips: vi.fn(async () => trips),
    imageUrl: () => '',
}));

const getAllUpcomingDepartures = vi.fn();
const getBookableTripTypes = vi.fn();
vi.mock('@/lib/arctic', () => ({
    getAllUpcomingDepartures: (...args: never[]) =>
        getAllUpcomingDepartures(...args),
    getBookableTripTypes: (...args: never[]) => getBookableTripTypes(...args),
}));

import TripFinderPage from './page';

function props(params: Record<string, string> = {}) {
    return { searchParams: Promise.resolve(params) };
}

test('no params renders question 1 with progress and a skip link', async () => {
    render(await TripFinderPage(props()));

    expect(
        screen.getByRole('heading', { level: 1, name: /who's coming\?/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/question 1 of 5/i)).toBeInTheDocument();
    // Options are links carrying the answer as a query param.
    expect(
        screen.getByRole('link', { name: /bringing kids/i }),
    ).toHaveAttribute('href', '/trip-finder?who=kids');
    expect(
        screen.getByRole('link', { name: /not sure yet — skip/i }),
    ).toHaveAttribute('href', '/trip-finder?who=skip');
});

test('kids answer asks the age follow-up on the same progress step', async () => {
    render(await TripFinderPage(props({ who: 'kids' })));

    expect(
        screen.getByRole('heading', {
            level: 1,
            name: /youngest adventurer/i,
        }),
    ).toBeInTheDocument();
    expect(screen.getByText(/question 1 of 5/i)).toBeInTheDocument();
    // Back drops the who answer.
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute(
        'href',
        '/trip-finder?',
    );
});

test('full answers render a best match with reasons and a /book deep link', async () => {
    getAllUpcomingDepartures.mockResolvedValue([
        {
            id: 900,
            triptypeid: 46,
            start: '2027-07-12',
            duration: '96:00:00',
            remainingopenings: 6,
            canceled: false,
        },
    ]);
    getBookableTripTypes.mockResolvedValue([{ id: 46 }, { id: 37 }]);

    render(
        await TripFinderPage(
            props({
                who: 'kids',
                age: '8-12',
                month: '7',
                days: 'classic',
                thrill: 'splash',
                activity: 'raft',
            }),
        ),
    );

    // Lodore wins for a family with an 8-year-old wanting splash in July.
    expect(
        screen.getByRole('heading', { level: 2, name: 'Best Match' }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('heading', { level: 3, name: /gates of lodore/i }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('heading', { level: 3, name: /why it fits/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/kids 7\+ welcome in july/i)).toBeInTheDocument();

    // Availability line deep-links into /book, month-filtered and anchored.
    expect(screen.getByText('Jul 12 – Jul 15')).toBeInTheDocument();
    expect(
        screen.getByRole('link', { name: /see dates & book/i }),
    ).toHaveAttribute(
        'href',
        '/book?month=2027-07#trip-sanity-gates-of-lodore',
    );

    // Editable answer chips drop exactly one param.
    expect(screen.getByRole('link', { name: /when: july/i })).toHaveAttribute(
        'href',
        '/trip-finder?who=kids&age=8-12&days=classic&thrill=splash&activity=raft',
    );
});

test('results render with the phone fallback when Arctic is down', async () => {
    getAllUpcomingDepartures.mockResolvedValue(null);
    getBookableTripTypes.mockResolvedValue(null);

    render(
        await TripFinderPage(
            props({
                who: 'adults',
                month: 'skip',
                days: 'skip',
                thrill: 'big',
                activity: 'raft',
            }),
        ),
    );

    expect(
        screen.getByRole('heading', { level: 2, name: 'Best Match' }),
    ).toBeInTheDocument();
    expect(
        screen.getByText(/live availability is napping/i),
    ).toBeInTheDocument();
    const phoneLinks = screen.getAllByRole('link', { name: '801-266-2087' });
    expect(phoneLinks.length).toBeGreaterThan(0);
    expect(phoneLinks[0]).toHaveAttribute('href', 'tel:+18012662087');
});
