/**
 * Seeds the Sanity "Trip Finder" singleton from the in-code default spec
 * (DEFAULT_TRIP_FINDER_SPEC in src/lib/trip-finder.ts), so the Studio opens
 * with today's questions, answers, dials, and photos already in place and
 * Holiday edits from there.
 *
 * Uploads the seven public/trip-finder/*.jpg backgrounds as image assets
 * (reusing any asset already uploaded under the same filename) and points
 * each activity answer at the tripType document its slug names.
 *
 * Safe to run before the code that reads the document deploys — deployed
 * code ignores it until then, and the in-code default stays as the
 * permanent fallback, so there is no contract phase. Idempotent:
 * deterministic _id and _keys, createOrReplace.
 *
 * Imports the TypeScript module directly, so run with type stripping:
 *
 *   Dry run:  node --experimental-strip-types scripts/seed-trip-finder-spec.mjs
 *   Write:    node --experimental-strip-types scripts/seed-trip-finder-spec.mjs --write
 */
import { createReadStream, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createClient } from '@sanity/client';
import { DEFAULT_TRIP_FINDER_SPEC } from '../src/lib/trip-finder.ts';

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

const WRITE = process.argv.includes('--write');
const PUBLIC_DIR = new URL('../public/', import.meta.url).pathname;

const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
});

/** Reuse an asset uploaded under this filename; upload otherwise. */
async function imageAssetId(publicPath) {
    const filename = basename(publicPath);
    const existing = await client.fetch(
        `*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`,
        { filename },
    );
    if (existing) {
        console.log(`   = ${filename} — already uploaded`);
        return existing;
    }
    if (!WRITE) {
        console.log(`   ↑ ${filename} — would upload`);
        return `image-would-upload-${filename}`;
    }
    const asset = await client.assets.upload(
        'image',
        createReadStream(join(PUBLIC_DIR, publicPath.replace(/^\//, ''))),
        { filename },
    );
    console.log(`   ↑ ${filename} — uploaded as ${asset._id}`);
    return asset._id;
}

function condition(c) {
    return c
        ? {
              _type: 'tripFinderCondition',
              question: c.question,
              answer: c.answer,
          }
        : undefined;
}

async function main() {
    console.log(
        `${WRITE ? 'WRITE' : 'DRY RUN'} — project ${projectId}, dataset ${dataset}\n`,
    );

    // Activity answers reference tripType documents by slug.
    const tripTypes = await client.fetch(
        `*[_type == "tripType"]{ _id, "slug": slug.current }`,
    );
    const tripTypeId = Object.fromEntries(
        tripTypes.map((t) => [t.slug, t._id]),
    );

    console.log('1. Photos');
    const questions = [];
    for (const q of DEFAULT_TRIP_FINDER_SPEC.questions) {
        const assetId = await imageAssetId(q.image);
        const options = q.options.map((o) => {
            const option = {
                _type: 'tripFinderOption',
                _key: `${q.id}-${o.value}`,
                label: o.label,
                value: o.value,
            };
            if (o.sublabel) option.sublabel = o.sublabel;
            if (o.bikeSublabel) option.bikeSublabel = o.bikeSublabel;
            if (o.targetClass !== undefined) option.targetClass = o.targetClass;
            if (o.floorAge !== undefined) option.floorAge = o.floorAge;
            if (o.centerDays !== undefined) option.centerDays = o.centerDays;
            if (o.month !== undefined) option.month = o.month;
            if (o.tripTypeSlug !== undefined) {
                const ref = tripTypeId[o.tripTypeSlug];
                if (!ref) {
                    throw new Error(
                        `No tripType with slug "${o.tripTypeSlug}" — run the taxonomy migration first`,
                    );
                }
                option.tripType = { _type: 'reference', _ref: ref };
            }
            return option;
        });

        const question = {
            _type: 'tripFinderQuestion',
            _key: q.id,
            kind: q.id,
            title: q.title,
            shortLabel: q.shortLabel,
            skipLabel: q.skipLabel,
            image: {
                _type: 'image',
                asset: { _type: 'reference', _ref: assetId },
                alt: q.imageAlt,
            },
            options,
        };
        if (q.subline) question.subline = q.subline;
        if (q.ethos) question.ethos = q.ethos;
        if (q.id !== 'who') question.weight = q.weight;
        if (q.onlyWhen) question.onlyWhen = condition(q.onlyWhen);
        if (q.skipWhen) question.skipWhen = condition(q.skipWhen);
        questions.push(question);
    }

    const doc = {
        _id: 'tripFinderSpec',
        _type: 'tripFinderSpec',
        questions,
        minConfidentScore: DEFAULT_TRIP_FINDER_SPEC.tuning.minConfidentScore,
        resultsShown: DEFAULT_TRIP_FINDER_SPEC.tuning.resultsShown,
    };

    console.log(`\n2. Trip Finder document — ${questions.length} questions:`);
    for (const q of questions) {
        const rule = q.onlyWhen
            ? ` (only when ${q.onlyWhen.question} = ${q.onlyWhen.answer})`
            : q.skipWhen
              ? ` (skip when ${q.skipWhen.question} = ${q.skipWhen.answer})`
              : '';
        console.log(
            `   ${q.kind.padEnd(9)} "${q.title}" — ${q.options.length} answers${rule}`,
        );
    }

    if (WRITE) {
        await client.createOrReplace(doc);
        console.log('\nWritten. Open /studio → Trip Finder to see it.');
    } else {
        console.log('\nDry run only. Pass --write to seed the dataset.');
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
