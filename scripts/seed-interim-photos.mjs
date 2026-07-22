/**
 * Uploads INTERIM photos (from the old bikeraft.com site) into Sanity and
 * attaches them to the seeded documents, so every page renders fully while
 * the Holiday team replaces them with final photography in /studio.
 *
 * - Only touches image fields that are currently EMPTY (never overwrites a
 *   photo the team has already uploaded).
 * - Skips URLs that no longer resolve and reports them.
 * - Idempotent: re-running re-checks emptiness, and repeated uploads of the
 *   same bytes dedupe inside Sanity via content hashing.
 *
 * Run from website/:  node scripts/seed-interim-photos.mjs
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

const WP = 'https://www.bikeraft.com/wp-content/uploads';

// slot → { url, doc, path } ; kind: 'single' (image field), 'photos' (trip
// photos array), 'learn' (learnContent[_key].image)
const slots = [
    // Homepage
    { label: 'homepage hero', url: `${WP}/2025/12/SRO_0237-scaled.jpg`, doc: 'homepage', kind: 'single', field: 'heroImage' },
    { label: 'story vintage (left)', url: `${WP}/2021/11/Holiday-River-Rafting-vintage.jpg`, doc: 'homepage', kind: 'single', field: 'storyImageLeft' },
    { label: 'story Dee portrait', url: `${WP}/2021/11/Dee-Holladay-portrait.jpg`, doc: 'homepage', kind: 'single', field: 'storyImagePortrait' },
    { label: 'learn: river cooking', url: `${WP}/2025/11/river-cooking.jpg`, doc: 'homepage', kind: 'learn', key: 'learn-0' },
    { label: 'learn: triple rig', url: `${WP}/2025/11/triple-rig-history.jpg`, doc: 'homepage', kind: 'learn', key: 'learn-1' },
    { label: 'learn: packing', url: `${WP}/2025/11/packing-for-trip.jpg`, doc: 'homepage', kind: 'learn', key: 'learn-2' },
    { label: 'learn: stargazing', url: `${WP}/2025/11/stargazing-on-river.jpg`, doc: 'homepage', kind: 'learn', key: 'learn-3' },

    // Trips (photos[0])
    { label: 'trip: cataract', url: `${WP}/2025/11/Cataract-Canyon-Rafting-Trips-4.jpg`, doc: 'trip-cataract-canyon', kind: 'photos', alt: 'Rafts running Cataract Canyon whitewater' },
    { label: 'trip: westwater', url: `${WP}/2025/11/Westwater-Canyon-Rafting-Trips.jpg`, doc: 'trip-westwater-canyon', kind: 'photos', alt: 'Rafting Westwater Canyon' },
    { label: 'trip: the maze', url: `${WP}/2025/11/The-Maze-Canyonlands.jpg`, doc: 'trip-the-maze', kind: 'photos', alt: 'Mountain biking the Maze district, Canyonlands' },
    { label: 'trip: lodore', url: `${WP}/2025/11/Gates-of-Lodore-Rafting.jpg`, doc: 'trip-gates-of-lodore', kind: 'photos', alt: 'Rafting the Gates of Lodore' },
    { label: 'trip: desolation bluegrass', url: `${WP}/2025/11/Desolation-Canyon-Rafting-Trip-3-1.jpg`, doc: 'trip-desolation-canyon-bluegrass', kind: 'photos', alt: 'Rafts in Desolation Canyon' },
    { label: 'trip: yampa', url: `${WP}/2025/10/Yampa-River-Rafting-Tiger-Wall.jpg`, doc: 'trip-yampa', kind: 'photos', alt: 'Yampa River at Tiger Wall' },

    // Rivers (image)
    { label: 'river: desolation', url: `${WP}/2025/11/Desolation-Canyon-Rafting-Trip-3-1.jpg`, doc: 'river-desolation', kind: 'single', field: 'image' },
    { label: 'river: yampa', url: `${WP}/2025/10/Yampa-River-Rafting-Tiger-Wall.jpg`, doc: 'river-yampa', kind: 'single', field: 'image' },
    { label: 'river: lodore', url: `${WP}/2025/11/Gates-of-Lodore-Rafting.jpg`, doc: 'river-gates-of-lodore', kind: 'single', field: 'image' },
    { label: 'river: westwater', url: `${WP}/2025/11/Westwater-Canyon-Rafting-Trips.jpg`, doc: 'river-westwater', kind: 'single', field: 'image' },
    { label: 'river: cataract', url: `${WP}/2025/11/Cataract-Canyon-whitewater-rafting.png`, doc: 'river-cataract', kind: 'single', field: 'image' },
    { label: 'river: san juan', url: `${WP}/2025/11/San-Juan-River-Banner-1.png`, doc: 'river-san-juan', kind: 'single', field: 'image' },
    { label: 'river: white rim', url: `${WP}/2025/11/White-Rim-Mountain-Biking.jpg`, doc: 'river-white-rim', kind: 'single', field: 'image' },
    { label: 'river: maze', url: `${WP}/2025/11/The-Maze-Canyonlands.jpg`, doc: 'river-maze', kind: 'single', field: 'image' },
    { label: 'river: san rafael', url: `${WP}/2025/11/San-Rafael-Swell.jpg`, doc: 'river-san-rafael', kind: 'single', field: 'image' },
];

const assetCache = new Map(); // url → asset _id

async function uploadFromUrl(url, label) {
    if (assetCache.has(url)) return assetCache.get(url);
    const res = await fetch(url);
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.startsWith('image/')) {
        return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = url.split('/').pop() ?? 'interim.jpg';
    const asset = await client.assets.upload('image', buf, {
        filename: `interim-${filename}`,
        source: { name: 'bikeraft-interim', id: url, url },
    });
    assetCache.set(url, asset._id);
    return asset._id;
}

const imageValue = (assetId, alt) => ({
    _type: 'image',
    asset: { _type: 'reference', _ref: assetId },
    ...(alt ? { alt } : {}),
});

async function run() {
    const skippedDead = [];
    const skippedFilled = [];
    const attached = [];

    for (const slot of slots) {
        const doc = await client.getDocument(slot.doc);
        if (!doc) {
            skippedDead.push(`${slot.label} (missing doc ${slot.doc})`);
            continue;
        }

        // Never overwrite a photo the team has already added.
        const isEmpty =
            slot.kind === 'single'
                ? !doc[slot.field]?.asset
                : slot.kind === 'photos'
                  ? !doc.photos?.length
                  : !doc.learnContent?.find((c) => c._key === slot.key)?.image
                        ?.asset;
        if (!isEmpty) {
            skippedFilled.push(slot.label);
            continue;
        }

        const assetId = await uploadFromUrl(slot.url, slot.label);
        if (!assetId) {
            skippedDead.push(`${slot.label} (${slot.url} unavailable)`);
            continue;
        }

        let patch = client.patch(slot.doc);
        if (slot.kind === 'single') {
            patch = patch.set({ [slot.field]: imageValue(assetId) });
        } else if (slot.kind === 'photos') {
            patch = patch.set({
                photos: [
                    { _key: 'interim-0', ...imageValue(assetId, slot.alt) },
                ],
            });
        } else {
            patch = patch.set({
                [`learnContent[_key=="${slot.key}"].image`]:
                    imageValue(assetId),
            });
        }
        await patch.commit();
        attached.push(slot.label);
    }

    console.log(`Attached ${attached.length}:`);
    for (const a of attached) console.log(`  ✓ ${a}`);
    if (skippedFilled.length) {
        console.log(`Already had photos (untouched): ${skippedFilled.length}`);
        for (const s of skippedFilled) console.log(`  • ${s}`);
    }
    if (skippedDead.length) {
        console.log(`Unavailable — needs a real photo from the team:`);
        for (const s of skippedDead) console.log(`  ✗ ${s}`);
    }
}

run().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
