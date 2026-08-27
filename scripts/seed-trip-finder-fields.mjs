/**
 * Seeds the trip-finder matching fields (maxRapidClass, seasonMonths,
 * minAge, minAgeOverrides, craftTypes) on the six authored trips.
 *
 * PLACEHOLDER VALUES — drafted from the legacy site and ARTA-style class
 * ratings; Holiday must confirm before launch (esp. Westwater/Lodore/Yampa
 * minimum ages and Yampa's season window). See docs vault for the decision
 * trail.
 *
 * Patches by slug rather than createOrReplace: these documents carry
 * authored content that must not be clobbered. Idempotent — re-running
 * sets the same field values again.
 *
 * Run from website/:  node scripts/seed-trip-finder-fields.mjs
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

function loadEnv(path) {
    const env = {};
    for (const line of readFileSync(path, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
    return env;
}

const env = loadEnv(new URL('../.env.local', import.meta.url));
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = env.NEXT_PUBLIC_SANITY_DATASET;
const token = env.SANITY_API_TOKEN;

if (!projectId || !dataset || !token) {
    console.error('Missing Sanity env vars in .env.local');
    process.exit(1);
}

const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
});

// slug → wizard fields. Months are 1–12.
const fieldsBySlug = {
    'cataract-canyon': {
        maxRapidClass: 4,
        seasonMonths: [5, 6, 7, 8, 9],
        minAge: 8,
        minAgeOverrides: [
            {
                _key: 'spring-high-water',
                _type: 'minAgeOverride',
                months: [5, 6],
                minAge: 16,
                reason: 'spring high water',
            },
        ],
        craftTypes: ['oar-raft', 'paddle-raft', 'inflatable-kayak'],
    },
    'westwater-canyon': {
        maxRapidClass: 4,
        seasonMonths: [5, 6, 7, 8, 9],
        minAge: 12,
        craftTypes: ['oar-raft', 'paddle-raft', 'inflatable-kayak'],
    },
    'the-maze': {
        seasonMonths: [4, 5, 9, 10],
        minAge: 10,
    },
    'gates-of-lodore': {
        maxRapidClass: 3,
        seasonMonths: [5, 6, 7, 8, 9],
        minAge: 7,
        craftTypes: ['oar-raft', 'paddle-raft', 'inflatable-kayak'],
    },
    'desolation-canyon-bluegrass': {
        maxRapidClass: 3,
        seasonMonths: [5, 6, 7, 8],
        minAge: 5,
        craftTypes: ['oar-raft', 'paddle-raft', 'inflatable-kayak', 'sup'],
    },
    yampa: {
        maxRapidClass: 4,
        seasonMonths: [5, 6],
        minAge: 10,
        craftTypes: ['oar-raft', 'paddle-raft', 'inflatable-kayak'],
    },
};

const trips = await client.fetch(
    '*[_type == "trip" && slug.current in $slugs]{ _id, "slug": slug.current }',
    { slugs: Object.keys(fieldsBySlug) },
);

const found = new Set(trips.map((t) => t.slug));
for (const slug of Object.keys(fieldsBySlug)) {
    if (!found.has(slug)) console.warn(`⚠ no trip found for slug "${slug}"`);
}

for (const trip of trips) {
    await client.patch(trip._id).set(fieldsBySlug[trip.slug]).commit();
    console.log(`✔ patched ${trip.slug}`);
}

console.log(`Done — ${trips.length} trips patched.`);
