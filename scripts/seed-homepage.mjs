/**
 * Seeds the Sanity `production` dataset with the homepage content (categories,
 * rivers, featured trips, and the Homepage singleton with ordered references +
 * Learn cards). Text/structure only — no images; the Holiday team uploads photos
 * in /studio. Idempotent: uses deterministic _ids + createOrReplace.
 *
 * Run from website/:  node scripts/seed-homepage.mjs
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

// --- Load env from .env.local (no extra deps) ---
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

const slug = (current) => ({ _type: 'slug', current });
const ref = (id) => ({ _type: 'reference', _ref: id, _key: id });

// --- Categories ---
const categories = [
    { _id: 'category-whitewater-rafting', name: 'Whitewater Rafting' },
    { _id: 'category-mountain-biking', name: 'Mountain Biking' },
].map((c) => ({
    _type: 'tripCategory',
    _id: c._id,
    name: c.name,
    slug: slug(c._id.replace('category-', '')),
}));

// --- Rivers (order matches the river selector) ---
const riverDefs = [
    ['Desolation', 'desolation'],
    ['Yampa', 'yampa'],
    ['Gates of Lodore', 'gates-of-lodore'],
    ['Westwater', 'westwater'],
    ['Cataract', 'cataract'],
    ['San Juan', 'san-juan'],
    ['White Rim', 'white-rim'],
    ['Maze', 'maze'],
    ['San Rafael', 'san-rafael'],
];
const rivers = riverDefs.map(([name, s]) => ({
    _type: 'river',
    _id: `river-${s}`,
    name,
    slug: slug(s),
}));

// --- Featured trips (order matches the homepage grid) ---
const WW = 'category-whitewater-rafting';
const MB = 'category-mountain-biking';
const tripDefs = [
    {
        s: 'cataract-canyon',
        name: 'Cataract Canyon',
        river: 'river-cataract',
        cat: WW,
        duration: 6,
        durationLabel: '5/6 Days',
        startingPrice: '$1,630',
        tagline:
            'Legendary whitewater through the heart of Canyonlands National Park.',
    },
    {
        s: 'westwater-canyon',
        name: 'Westwater Canyon',
        river: 'river-westwater',
        cat: WW,
        duration: 3,
        durationLabel: '2/3 Days',
        startingPrice: '$599',
        tagline: 'World-class whitewater within a weekend.',
    },
    {
        s: 'the-maze',
        name: 'The Maze',
        river: 'river-maze',
        cat: MB,
        duration: 5,
        durationLabel: '4/5 Days',
        startingPrice: '$1,415',
        tagline: 'Bike in solitude in least-visited district of Canyonlands.',
    },
    {
        s: 'gates-of-lodore',
        name: 'Gates of Lodore',
        river: 'river-gates-of-lodore',
        cat: WW,
        duration: 4,
        durationLabel: '3/4 Days',
        startingPrice: '$1,300',
        tagline: 'Experience Dinosaur National Monument from a scenic river.',
    },
    {
        s: 'desolation-canyon-bluegrass',
        name: 'Desolation Canyon',
        river: 'river-desolation',
        cat: WW,
        duration: 5,
        durationLabel: '4/5 Days',
        startingPrice: '$1,300',
        subtitle: 'With The Pickpockets Bluegrass',
        ribbon: 'Specialty Music Trip',
    },
    {
        s: 'yampa',
        name: 'Yampa River',
        river: 'river-yampa',
        cat: WW,
        duration: 5,
        durationLabel: '4/5 Days',
        startingPrice: '$1,300',
        tagline: 'Stunning beauty on a free-flowing river.',
    },
];
const trips = tripDefs.map((t) => ({
    _type: 'trip',
    _id: `trip-${t.s}`,
    name: t.name,
    slug: slug(t.s),
    river: { _type: 'reference', _ref: t.river },
    categories: [{ _type: 'reference', _ref: t.cat, _key: t.cat }],
    duration: t.duration,
    durationLabel: t.durationLabel,
    startingPrice: t.startingPrice,
    ...(t.tagline ? { tagline: t.tagline } : {}),
    ...(t.subtitle ? { subtitle: t.subtitle } : {}),
    ...(t.ribbon ? { ribbon: t.ribbon } : {}),
}));

// --- Homepage singleton ---
const learnDefs = [
    ['River Cooking 101', '/blog/river-cooking-101', false],
    ['Triple Rig History', '/blog/triple-rig-history', false],
    ['Packing For Your Trip', '/blog/packing-for-your-trip', true],
    ['Stargazing On The River', '/blog/stargazing-on-the-river', false],
];
const homepage = {
    _type: 'homepage',
    _id: 'homepage',
    heroHeading:
        'Multi-Day Raft and Bike Expeditions in the Heart of Canyon Country',
    storyBody:
        'From the Holiday family to all of our guests over the decades: Thank you for making us the company we are today! Here’s to many more years of joyful moments shared in wild places!',
    storyCtaText: 'Learn More',
    storyCtaLink: '/about',
    featuredTrips: trips.map((t) => ref(t._id)),
    rivers: rivers.map((r) => ref(r._id)),
    learnContent: learnDefs.map(([title, link, isVideo], i) => ({
        _key: `learn-${i}`,
        _type: 'learnCard',
        title,
        link,
        isVideo,
    })),
};

async function run() {
    const docs = [...categories, ...rivers, ...trips, homepage];
    const tx = client.transaction();
    for (const doc of docs) tx.createOrReplace(doc);
    await tx.commit();
    console.log(
        `Seeded: ${categories.length} categories, ${rivers.length} rivers, ${trips.length} trips, 1 homepage singleton.`,
    );
}

run().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
