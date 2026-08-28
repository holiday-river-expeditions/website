/**
 * Merges the `activity` and `tripCategory` taxonomies into one `tripType`.
 *
 * The two old types split every trip identically — Activity drove /rafting
 * and /biking and the wizard, Trip Category supplied the card tag — under
 * different names, with nothing keeping them in step. See the content model
 * audit (docs/progress/2026-08-27.md) for the full finding.
 *
 * Runs in two phases so production is never mid-break. The deployed site
 * reads the OLD fields until this branch ships, so expand adds the new shape
 * alongside them and contract removes the old shape only once the new code
 * is live. Running contract early would 404 /rafting and /biking.
 *
 *   EXPAND (safe to run against production before deploy)
 *     1. Creates the three tripType documents (Rafting, Biking, Combo).
 *     2. Points every trip at one of them, inferred from its old activity —
 *        a trip carrying both rafting and biking becomes Combo.
 *
 *   CONTRACT (run only after this branch is deployed)
 *     3. Unsets the retired fields (activities, categories, difficulty).
 *     4. Deletes the old activity and tripCategory documents.
 *
 * Idempotent: deterministic _ids, createOrReplace, and step 2 recomputes from
 * whichever of the old or new fields is still present. Safe to re-run.
 *
 * Dry run (default):  node scripts/migrate-trip-types.mjs
 * Expand:             node scripts/migrate-trip-types.mjs --expand
 * Contract:           node scripts/migrate-trip-types.mjs --contract
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

const EXPAND = process.argv.includes('--expand');
const CONTRACT = process.argv.includes('--contract');
const DRY = !EXPAND && !CONTRACT;

const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
});

const slug = (current) => ({ _type: 'slug', current });

const TRIP_TYPES = [
    {
        _id: 'trip-type-rafting',
        _type: 'tripType',
        name: 'Rafting',
        slug: slug('rafting'),
        cardLabel: 'Whitewater Rafting',
        tagColor: 'teal',
        order: 10,
    },
    {
        _id: 'trip-type-biking',
        _type: 'tripType',
        name: 'Biking',
        slug: slug('biking'),
        cardLabel: 'Mountain Biking',
        tagColor: 'sand',
        order: 20,
    },
    {
        // Combo trips carry their own tag but list on the Biking page
        // (Aug 20 decision), which `listsWith` expresses.
        _id: 'trip-type-combo',
        _type: 'tripType',
        name: 'Combo',
        slug: slug('combo'),
        cardLabel: 'Raft & Ride',
        tagColor: 'evergreen',
        listsWith: { _type: 'reference', _ref: 'trip-type-biking' },
        order: 30,
    },
];

/** Old activity/category slugs → new tripType id. */
const RAFTING_SLUGS = new Set(['rafting', 'whitewater-rafting']);
const BIKING_SLUGS = new Set(['biking', 'mountain-biking']);

function inferTripTypeId(trip) {
    const slugs = [
        ...(trip.activitySlugs ?? []),
        ...(trip.categorySlugs ?? []),
    ].filter(Boolean);

    const raft = slugs.some((s) => RAFTING_SLUGS.has(s));
    const bike = slugs.some((s) => BIKING_SLUGS.has(s));

    if (raft && bike) return 'trip-type-combo';
    if (bike) return 'trip-type-biking';
    if (raft) return 'trip-type-rafting';
    return null;
}

async function main() {
    const phase = DRY ? 'DRY RUN' : EXPAND ? 'EXPAND' : 'CONTRACT';
    console.log(`${phase} — project ${projectId}, dataset ${dataset}\n`);

    // --- 1. Trip types (expand) ---
    // The old activity documents carry the landing-page intro and hero image;
    // those are Holiday's copy and photos, so they move across rather than
    // being dropped. Anything already edited on the new document wins, which
    // keeps re-runs from clobbering Studio work.
    const [legacy, existing] = await Promise.all([
        client.fetch(
            `*[_type == "activity"]{ "slug": slug.current, description, image }`,
        ),
        client.fetch(
            `*[_type == "tripType"]{ "slug": slug.current, description, image }`,
        ),
    ]);
    const bySlug = (rows) =>
        Object.fromEntries(rows.filter((r) => r.slug).map((r) => [r.slug, r]));
    const legacyBySlug = bySlug(legacy);
    const existingBySlug = bySlug(existing);

    const docs = TRIP_TYPES.map((doc) => {
        const slugValue = doc.slug.current;
        const prior = existingBySlug[slugValue] ?? {};
        const old = legacyBySlug[slugValue] ?? {};
        const description = prior.description ?? old.description;
        const image = prior.image ?? old.image;
        return {
            ...doc,
            ...(description ? { description } : {}),
            ...(image ? { image } : {}),
        };
    });

    if (EXPAND) {
        const tx = client.transaction();
        for (const doc of docs) tx.createOrReplace(doc);
        await tx.commit();
    }
    for (const doc of docs) {
        const carried = [
            doc.description ? 'description' : null,
            doc.image ? 'image' : null,
        ].filter(Boolean);
        console.log(
            `1. ${doc.name.padEnd(8)} ${carried.length ? `carries ${carried.join(' + ')}` : 'no copy yet'}${EXPAND ? ' — written' : ''}`,
        );
    }

    // --- 2. Repoint trips ---
    const trips = await client.fetch(`*[_type == "trip"] | order(name asc) {
        _id,
        name,
        "activitySlugs": activities[]->slug.current,
        "categorySlugs": categories[]->slug.current,
        "currentTripType": tripType->slug.current,
        "hasDifficulty": defined(difficulty)
    }`);

    console.log(`\n2. Trips (${trips.length}):`);
    const unresolved = [];
    const tx = client.transaction();

    for (const trip of trips) {
        const targetId = inferTripTypeId(trip);
        if (!targetId) {
            // Already migrated on a previous run keeps its type; a genuinely
            // untagged trip is reported rather than guessed at.
            if (trip.currentTripType) {
                console.log(
                    `   = ${trip.name} — already ${trip.currentTripType}`,
                );
                continue;
            }
            unresolved.push(trip);
            console.log(
                `   ! ${trip.name} — no activity or category to infer from`,
            );
            continue;
        }

        const label = targetId.replace('trip-type-', '');
        console.log(`   → ${trip.name} — ${label}`);

        if (EXPAND) {
            tx.patch(trip._id, (p) =>
                p.set({ tripType: { _type: 'reference', _ref: targetId } }),
            );
        }
    }

    if (EXPAND) await tx.commit();

    // --- 3. Retire the old shape (contract) ---
    const stale = await client.fetch(
        `*[_type in ["activity", "tripCategory"]]{ _id, _type, name }`,
    );
    const withOldFields = trips.filter(
        (t) => t.activitySlugs || t.categorySlugs || t.hasDifficulty,
    );

    console.log(
        `\n3. Old shape — ${withOldFields.length} trip(s) still carrying activities/categories/difficulty, ${stale.length} taxonomy document(s):`,
    );
    for (const doc of stale) {
        console.log(`   ✕ ${doc._type} · ${doc.name} (${doc._id})`);
    }

    if (CONTRACT) {
        if (unresolved.length > 0) {
            console.log(
                '\n   Refusing to contract — some trips above have no trip type.',
            );
            process.exitCode = 1;
            return;
        }
        const del = client.transaction();
        for (const trip of withOldFields) {
            del.patch(trip._id, (p) =>
                p.unset(['activities', 'categories', 'difficulty']),
            );
        }
        for (const doc of stale) del.delete(doc._id);
        await del.commit();
        console.log('   removed');
    }

    if (DRY) {
        console.log(
            '\nDry run only.' +
                '\n  --expand    adds trip types and points trips at them (safe before deploy)' +
                '\n  --contract  removes the old fields and documents (only after deploy)',
        );
    } else {
        console.log('\nDone.');
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
