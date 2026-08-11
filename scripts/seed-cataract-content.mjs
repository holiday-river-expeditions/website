/**
 * Seeds the full trip-page exemplar on Cataract Canyon: featured review
 * (verbatim from bikeraft.com — the client's own site), sample itinerary
 * (abbreviated from the current page), min age, season, and curated related
 * trips. Also sets the siteSettings reviews trust-strip label (611 five-star
 * reviews per the 2026-02 site audit; TripAdvisor/Google URLs left for
 * Darius to fill in /studio).
 *
 * Idempotent: fixed values, safe to re-run.
 * Run from website/:  node scripts/seed-cataract-content.mjs
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
const client = createClient({
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: env.SANITY_API_TOKEN,
    useCdn: false,
});

const ref = (id) => ({ _type: 'reference', _ref: id, _key: id });

const itinerary = [
    {
        _key: 'night-before',
        _type: 'itineraryDay',
        day: 'Night Before',
        title: 'Meet the Crew',
        description:
            'We gather at the Green River warehouse at 7 p.m. for orientation — meet your guides, get your dry bags, and pack for the river.',
    },
    {
        _key: 'day-1',
        _type: 'itineraryDay',
        day: 'Day 1',
        title: 'Launch & First Camp',
        description:
            'A short drive to the put-in and we push off. Paddle a kayak or SUP through calm water, lunch on a sandbar, and hike to a petrified wood site before the first riverside camp and dinner.',
    },
    {
        _key: 'day-2',
        _type: 'itineraryDay',
        day: 'Day 2',
        title: 'Canyon Time',
        description:
            'The Colorado meanders between deepening red walls. Swim, hike to ancient Fremont Culture sites, and watch for river otters and blue herons.',
    },
    {
        _key: 'day-3',
        _type: 'itineraryDay',
        day: 'Day 3',
        title: 'The Confluence',
        description:
            'The Green River joins the Colorado in the heart of Canyonlands. Swim at the confluence, spot the Doll House formations, and rig for whitewater.',
    },
    {
        _key: 'day-4',
        _type: 'itineraryDay',
        day: 'Day 4',
        title: 'The Big Drops',
        description:
            'The main event: 35+ Class III–IV rapids, including Little Niagara and Satan’s Gut. Scout the big ones, explore side canyons, and celebrate at camp.',
    },
    {
        _key: 'day-5',
        _type: 'itineraryDay',
        day: 'Day 5',
        title: 'Last Rapids & Takeout',
        description:
            'A final taste of whitewater, then a scenic float into Glen Canyon Recreation Area. Takeout near Hite and back to Green River by early evening.',
    },
];

async function run() {
    await client
        .patch('trip-cataract-canyon')
        .set({
            featuredReview: {
                quote: 'The guides were truly top-notch. Their first priority was clearly guest safety followed very quickly by service.',
                author: 'Sierra Club member',
                source: 'Guest review, 2023',
            },
            itinerary,
            minAge: 8,
            season: 'May – September',
            relatedTrips: [
                ref('trip-westwater-canyon'),
                ref('trip-gates-of-lodore'),
                ref('trip-the-maze'),
            ],
            faqs: [
                ref('faq-safety-1'),
                ref('faq-trip-preparation-1'),
                ref('faq-booking-1'),
            ],
        })
        .commit();
    console.log('trip-cataract-canyon → itinerary, review, facts, related, faqs');

    await client
        .patch('siteSettings')
        .setIfMissing({
            reviews: {
                ratingLabel: '5.0 stars from 600+ guest reviews',
            },
        })
        .commit();
    console.log('siteSettings → reviews.ratingLabel (URLs left for /studio)');
}

run().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
