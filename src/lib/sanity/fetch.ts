import { client } from './client';
import {
    allActivitiesQuery,
    allFaqsQuery,
    allRiversQuery,
    allTripsQuery,
    featuredTripsQuery,
    homepageQuery,
    pageBySlugQuery,
    riverBySlugQuery,
    siteSettingsQuery,
    tripBySlugQuery,
} from './queries';

export async function getAllTrips() {
    return client.fetch(allTripsQuery);
}

export async function getTripBySlug(slug: string) {
    return client.fetch(tripBySlugQuery, { slug });
}

export async function getAllRivers() {
    return client.fetch(allRiversQuery);
}

export async function getRiverBySlug(slug: string) {
    return client.fetch(riverBySlugQuery, { slug });
}

export async function getAllActivities() {
    return client.fetch(allActivitiesQuery);
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

export async function getHomepage() {
    return client.fetch(homepageQuery);
}

export async function getFeaturedTrips() {
    return client.fetch(featuredTripsQuery);
}
