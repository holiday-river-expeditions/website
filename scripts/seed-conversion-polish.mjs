/**
 * Seeds conversion-polish content: trip difficulty ratings (approved by
 * Darius 2026-08-10, mirroring bikeraft.com's own ratings), the homepage
 * hero CTA, and a descriptive story CTA label (was a vague "Learn More").
 *
 * Idempotent: plain patches with fixed values; safe to re-run.
 *
 * Run from website/:  node scripts/seed-conversion-polish.mjs
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

const difficulty = {
    'trip-cataract-canyon': 'challenging',
    'trip-westwater-canyon': 'challenging',
    'trip-the-maze': 'challenging',
    'trip-gates-of-lodore': 'moderate',
    'trip-yampa': 'moderate',
    'trip-desolation-canyon-bluegrass': 'moderate',
};

async function run() {
    for (const [id, value] of Object.entries(difficulty)) {
        await client.patch(id).set({ difficulty: value }).commit();
        console.log(`${id} → ${value}`);
    }

    await client
        .patch('homepage')
        .set({
            heroCtaText: 'Find Your Trip',
            heroCtaLink: '/trips',
            storyCtaText: 'Our Story',
            storyCtaLink: '/about',
        })
        .commit();
    console.log('homepage → hero CTA + story CTA labels set');
}

run().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
