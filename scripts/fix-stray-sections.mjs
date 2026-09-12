#!/usr/bin/env node
/**
 * One-off content fix (Darius, 2026-09-12): discards the stray draft that
 * renamed the San Juan section to "San Juan River", and deletes the "Moab
 * Biking / Westwater Rafting Combo" section, which describes a trip, not a
 * stretch of river. Both were left over from Justin's first Studio session.
 *
 * Refuses to delete anything that is still referenced. Sanity keeps
 * document history, so either can be restored from the Studio if needed.
 *
 * Run from website/:  node --env-file=.env.local scripts/fix-stray-sections.mjs
 */

import { createClient } from '@sanity/client';

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2025-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

const STRAY_DRAFT = 'drafts.river-san-juan';
const COMBO_SLUG = 'moab-biking-westwater-rafting-combo';

const combo = await client.fetch(
    `*[_type == "river" && slug.current == $slug]{ _id, name, "refs": count(*[references(^._id)]) }`,
    { slug: COMBO_SLUG },
);
const draft = await client.fetch(`*[_id == $id][0]{ _id, name }`, {
    id: STRAY_DRAFT,
});

const tx = client.transaction();
if (draft) {
    console.log(`discarding draft ${draft._id} ("${draft.name}")`);
    tx.delete(draft._id);
} else {
    console.log('stray San Juan draft already gone');
}
for (const doc of combo) {
    if (doc.refs === 0) {
        console.log(`deleting section ${doc._id} ("${doc.name}")`);
        tx.delete(doc._id);
    } else {
        console.log(`keeping ${doc._id}: still referenced ${doc.refs}×`);
    }
}
if (combo.length === 0) console.log('combo section already gone');

const result = await tx.commit();
console.log('done:', result.results?.map((r) => r.id) ?? '(nothing to do)');
