/**
 * Seeds the `specialtyType` taxonomy — the specialty families the legacy site
 * gave their own URL parents (see docs/project/site-audit.md), which now back
 * /specialty and /specialty/[slug].
 *
 * Text/structure only — no images; the Holiday team uploads photos in /studio.
 * Idempotent: deterministic _ids + createOrReplace.
 *
 * Deliberately does NOT author any trip.specialtyDepartures. Those name real
 * dates on real departures and belong to Holiday, not to a seed script.
 *
 * Run from website/:  node scripts/seed-specialty-types.mjs
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

const slug = (current) => ({ _type: 'slug', current });

// Families and their legacy URL parents, from docs/project/site-audit.md.
const types = [
    {
        id: 'specialty-canyon-concerts',
        name: 'Canyon Concerts',
        s: 'canyon-concerts',
        tagline: 'Live music on the beach, canyon walls for acoustics.',
        ribbonLabel: 'Specialty Music Trip',
        order: 10,
    },
    {
        id: 'specialty-stargazing',
        name: 'Dark Sky Stargazing',
        s: 'stargazing',
        tagline: 'New-moon departures under some of the darkest skies left.',
        ribbonLabel: 'Specialty Stargazing Trip',
        order: 20,
    },
    {
        id: 'specialty-womens',
        name: "Women's Trips",
        s: 'womens',
        tagline: 'All-women departures, women guides.',
        ribbonLabel: "Specialty Women's Trip",
        order: 30,
    },
    {
        id: 'specialty-youth-family',
        name: 'Youth & Family',
        s: 'youth-family',
        tagline: 'Built for school groups, scouts, and first-timers.',
        ribbonLabel: 'Specialty Youth Trip',
        order: 40,
    },
    {
        id: 'specialty-affinity',
        name: 'Affinity & Custom Groups',
        s: 'affinity',
        tagline: 'A whole boat of people who came for the same reason.',
        ribbonLabel: 'Specialty Group Trip',
        order: 50,
    },
];

const docs = types.map((t) => ({
    _id: t.id,
    _type: 'specialtyType',
    name: t.name,
    slug: slug(t.s),
    tagline: t.tagline,
    ribbonLabel: t.ribbonLabel,
    order: t.order,
}));

const run = async () => {
    const tx = docs.reduce(
        (t, doc) => t.createOrReplace(doc),
        client.transaction(),
    );
    await tx.commit();
    console.log(`Seeded ${docs.length} specialty types.`);

    // Desolation already carries the "Specialty Music Trip" ribbon and the
    // Pickpockets subtitle (scripts/seed-homepage.mjs) — this only records the
    // family that ribbon already asserts. setIfMissing so hand-curated
    // selections in the Studio are never clobbered.
    const desolation = await client.fetch(
        `*[_type == "trip" && slug.current == "desolation-canyon-bluegrass"][0]._id`,
    );
    if (desolation) {
        await client
            .patch(desolation)
            .setIfMissing({
                specialtyTypes: [
                    {
                        _type: 'reference',
                        _ref: 'specialty-canyon-concerts',
                        _key: 'specialty-canyon-concerts',
                    },
                ],
            })
            .commit();
        console.log('Linked Desolation Canyon to Canyon Concerts.');
    } else {
        console.log('Desolation trip not found — skipped the link.');
    }
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
