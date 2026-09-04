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

export async function getAllTrips() {
    return client.fetch(allTripsQuery);
}

export async function getTripFinderTrips() {
    return client.fetch(tripFinderTripsQuery);
}

export async function getTripFinderSpec() {
    return client.fetch(tripFinderSpecQuery);
}

export async function getTripBySlug(slug: string) {
    return client.fetch(tripBySlugQuery, { slug });
}

export async function getRiverBySlug(slug: string) {
    return client.fetch(riverBySlugQuery, { slug });
}

export async function getTripTypeBySlug(slug: string) {
    return client.fetch(tripTypeBySlugQuery, { slug });
}

export async function getAllTripTypes() {
    return client.fetch(allTripTypesQuery);
}

export async function getAllSpecialtyTypes() {
    return client.fetch(allSpecialtyTypesQuery);
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
    return client.fetch(homepageQuery);
}
