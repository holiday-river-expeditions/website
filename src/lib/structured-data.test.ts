import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/sanity', () => ({ imageUrl: () => '' }));

import { organizationJsonLd, parsePrice, tripJsonLd } from './structured-data';

beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://holidayriver.com');
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('parsePrice', () => {
    it.each([
        ['$1,435', 1435],
        ['1435', 1435],
        ['$ 1,435.50', 1435.5],
        ['$12,345', 12345],
    ])('reads %s as %d', (input, expected) => {
        expect(parsePrice(input)).toBe(expected);
    });

    it.each([
        null,
        undefined,
        '',
        'Call for pricing',
        '$1,200 to $1,800',
        '$0',
        '1,23',
    ])('returns null for %s', (input) => {
        expect(parsePrice(input)).toBeNull();
    });
});

describe('tripJsonLd', () => {
    it('builds a TouristTrip with an offer from the starting price', () => {
        expect(
            tripJsonLd({
                name: 'Cataract Canyon',
                description: 'A tagline from Sanity',
                path: '/trips/cataract-canyon',
                images: ['https://cdn.sanity.io/hero.jpg'],
                startingPrice: '$1,630',
            }),
        ).toEqual({
            '@context': 'https://schema.org',
            '@type': 'TouristTrip',
            name: 'Cataract Canyon',
            description: 'A tagline from Sanity',
            url: 'https://holidayriver.com/trips/cataract-canyon',
            image: ['https://cdn.sanity.io/hero.jpg'],
            provider: {
                '@type': 'TravelAgency',
                name: 'Holiday River Expeditions',
                url: 'https://holidayriver.com',
            },
            offers: {
                '@type': 'Offer',
                price: 1630,
                priceCurrency: 'USD',
                url: 'https://holidayriver.com/trips/cataract-canyon',
            },
        });
    });

    it('leaves the offer out when there is no usable price', () => {
        const data = tripJsonLd({
            name: 'Lodore',
            description: null,
            path: '/trips/lodore',
            images: [],
            startingPrice: null,
        });

        expect(data.offers).toBeUndefined();
        expect(data.image).toBeUndefined();
    });
});

describe('organizationJsonLd', () => {
    it('builds a TravelAgency from Site Settings', () => {
        expect(
            organizationJsonLd({
                telephone: '801-266-2087',
                email: 'info@holidayriver.com',
                address: '544 East 3900 South\nSalt Lake City, UT 84107',
                socialLinks: {
                    facebook: 'https://facebook.com/example',
                    instagram: '',
                },
                image: '',
            }),
        ).toEqual({
            '@context': 'https://schema.org',
            '@type': 'TravelAgency',
            name: 'Holiday River Expeditions',
            url: 'https://holidayriver.com',
            logo: 'https://holidayriver.com/android-chrome-192x192.png',
            telephone: '801-266-2087',
            email: 'info@holidayriver.com',
            address: '544 East 3900 South, Salt Lake City, UT 84107',
            sameAs: ['https://facebook.com/example'],
        });
    });
});
