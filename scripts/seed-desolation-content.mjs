/**
 * Seeds the sample itinerary and trip facts on Desolation Canyon, so the
 * "A Day on the River" section has somewhere to render — and so the Deso
 * footage in Drive has a home. Copy is abbreviated from the current
 * bikeraft.com Desolation Canyon page (the client's own site).
 *
 * NOTE: the Sanity document is currently titled "Desolation Canyon / With
 * The Pickpockets Bluegrass" with durationLabel "4/5 Days". That subtitle
 * belongs to a different trip — bikeraft.com runs The Pickpockets through
 * Lodore Canyon (4 days), not Deso (5/6 days). This script seeds the real
 * Desolation itinerary and facts but deliberately does NOT touch `name`,
 * `subtitle`, `slug`, or `durationLabel` — untangling those two trips is a
 * content decision, not a scripted one. See docs/progress/2026-08-11.md.
 *
 * Idempotent: fixed values, safe to re-run — but re-running RESTORES these
 * values, so it will clobber later Studio edits to the fields it sets.
 * Run from website/:  node scripts/seed-desolation-content.mjs
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

const itinerary = [
    {
        _key: 'night-before',
        _type: 'itineraryDay',
        day: 'Night Before',
        title: 'Gear Drop & Orientation',
        description:
            'Stop by our Green River warehouse before 1 p.m. to drop off gear, then join the pre-trip meeting at 7 p.m. for waterproof bags, introductions, and everything you need to know before morning.',
    },
    {
        _key: 'day-1',
        _type: 'itineraryDay',
        day: 'Day 1',
        title: 'Fly In Over the Tavaputs',
        description:
            'Meet in the morning and drive to the Green River airstrip for a 35-minute flight over the Tavaputs Plateau — spectacular, and the only way in. A 45-minute walk down to the rafts (a vehicle ride is available if you would rather not hike), a hike to a turtle fossil, and first camp on a sandbar beneath the cottonwoods.',
    },
    {
        _key: 'day-2',
        _type: 'itineraryDay',
        day: 'Day 2',
        title: 'First Rapids & Fremont Country',
        description:
            'Row past Peter’s Point and Lighthouse Rock, then hop in an inflatable kayak to splash through the first rapids. Afternoon brings a side-canyon hike and a look at Fremont Culture sites tucked into the walls.',
    },
    {
        _key: 'day-3',
        _type: 'itineraryDay',
        day: 'Day 3',
        title: 'Rock Creek Ranch & Chandler Falls',
        description:
            'Wander the historic Rock Creek Ranch, where Butch Cassidy’s Wild Bunch slept, and spot granaries high on the cliffs. Downstream the river picks up through Chandler Falls and Cow Swim.',
    },
    {
        _key: 'day-4',
        _type: 'itineraryDay',
        day: 'Day 4',
        title: 'Into Gray Canyon',
        description:
            'Wire Fence, Three Fords, and Coal Creek carry us out of Desolation and into Gray Canyon, where the walls change character. A surveyor’s cabin ruin waits on the bank for anyone who wants to poke around.',
    },
    {
        _key: 'day-5',
        _type: 'itineraryDay',
        day: 'Day 5',
        title: 'Last Rapids to Swasey’s',
        description:
            'A final run of rapids down to the takeout at Swasey’s Beach, with the shuttle back to headquarters arriving around 3–4 p.m.',
    },
];

async function run() {
    await client
        .patch('trip-desolation-canyon-bluegrass')
        .set({
            itinerary,
            minAge: 5,
            season: 'May – August',
        })
        .commit();
    console.log(
        'trip-desolation-canyon-bluegrass → itinerary (6 entries), minAge, season',
    );
}

run().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
