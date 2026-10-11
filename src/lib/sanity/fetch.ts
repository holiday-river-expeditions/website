import { withArcticPrices } from '@/lib/arctic/prices';
import { client } from './client';
import {
    allFaqsQuery,
    allPostsQuery,
    allSpecialtyTypesQuery,
    allTripsQuery,
    allTripTypesQuery,
    homepageQuery,
    pageBySlugQuery,
    postBySlugQuery,
    riverBySlugQuery,
    siteSettingsQuery,
    tripBySlugQuery,
    tripFinderSpecQuery,
    tripFinderTripsQuery,
    tripTypeBySlugQuery,
} from './queries';

// Every fetch that returns trip cards swaps the Sanity startingPrice for
// Arctic's live price (see withArcticPrices). Arctic is where Holiday sets
// prices; the Sanity field is the fallback.

export async function getAllTrips() {
    return withArcticPrices(await client.fetch(allTripsQuery));
}

export async function getTripFinderTrips() {
    return withArcticPrices(await client.fetch(tripFinderTripsQuery));
}

export async function getTripFinderSpec() {
    return client.fetch(tripFinderSpecQuery);
}

export async function getTripBySlug(slug: string) {
    const trip = await client.fetch(tripBySlugQuery, { slug });
    if (!trip) return trip;
    const [[priced], relatedTrips] = await Promise.all([
        withArcticPrices([trip]),
        withArcticPrices(trip.relatedTrips),
    ]);
    return { ...priced, relatedTrips };
}

export async function getRiverBySlug(slug: string) {
    const river = await client.fetch(riverBySlugQuery, { slug });
    return river && { ...river, trips: await withArcticPrices(river.trips) };
}

export async function getTripTypeBySlug(slug: string) {
    const tripType = await client.fetch(tripTypeBySlugQuery, { slug });
    return (
        tripType && {
            ...tripType,
            trips: await withArcticPrices(tripType.trips),
        }
    );
}

export async function getAllTripTypes() {
    return client.fetch(allTripTypesQuery);
}

export async function getAllSpecialtyTypes() {
    const types = await client.fetch(allSpecialtyTypesQuery);
    return Promise.all(
        types.map(async (type) => ({
            ...type,
            trips: await withArcticPrices(type.trips),
        })),
    );
}

export async function getAllFaqs() {
    return client.fetch(allFaqsQuery);
}

export async function getSiteSettings() {
    return client.fetch(siteSettingsQuery);
}

export async function getPageBySlug(slug: string) {
    return client.fetch(pageBySlugQuery, { slug });
}

export async function getAllPosts() {
    return client.fetch(allPostsQuery);
}

export async function getPostBySlug(slug: string) {
    return client.fetch(postBySlugQuery, { slug });
}

export async function getHomepage() {
    const homepage = await client.fetch(homepageQuery);
    return (
        homepage && {
            ...homepage,
            featuredTrips: await withArcticPrices(homepage.featuredTrips),
        }
    );
}
