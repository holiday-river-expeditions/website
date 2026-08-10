/**
 * Seeds the Sanity `production` dataset with starter blog posts. The four
 * slugs match the homepage "Learn & Get Inspired" card links (seeded by
 * seed-homepage.mjs), so those cards resolve instead of 404ing.
 *
 * Deliberately small: the full migration (167 posts on bikeraft.com) is an
 * open decision for Holiday — see docs/project/open-decisions.md.
 *
 * Idempotent: deterministic _ids + createOrReplace. Text only; the Holiday
 * team uploads images in /studio.
 *
 * Run from website/:  node scripts/seed-blog.mjs
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

let keyCounter = 0;
const key = (prefix) => `${prefix}-${keyCounter++}`;

function block(text, style = 'normal') {
    return {
        _type: 'block',
        _key: key('block'),
        style,
        markDefs: [],
        children: [{ _type: 'span', _key: key('span'), text, marks: [] }],
    };
}

const posts = [
    {
        _id: 'post-river-cooking-101',
        title: 'River Cooking 101',
        slug: 'river-cooking-101',
        category: 'culture-history',
        publishedAt: '2026-06-12T09:00:00Z',
        excerpt:
            'How a camp kitchen on a sandbar turns out meals worth writing home about — a tradition Sue Holladay started in 1966.',
        body: [
            block(
                'Ask returning guests what surprised them most about their first trip and the answer is rarely the rapids — it’s dinner. A full camp kitchen comes down the river with you, and the standard for what comes out of it was set by Sue Holladay back in 1966.',
            ),
            block(
                'Guides set the kitchen on the beach within an hour of landing: prep tables, dutch ovens, and a menu planned around the trip. Mornings start with coffee, tea, and cocoa before a hot breakfast; lunches are laid out riverside; and dinners have a way of turning into the evening’s main event.',
            ),
            block(
                'Dietary needs are part of the plan, not an afterthought — send in your guest data sheet at least 30 days out and the provisioners will build your trip’s menu around it.',
            ),
        ],
    },
    {
        _id: 'post-triple-rig-history',
        title: 'A Short History of the Triple Rig',
        slug: 'triple-rig-history',
        category: 'culture-history',
        publishedAt: '2026-06-05T09:00:00Z',
        excerpt:
            'Three rafts, lashed side by side, rowed through the biggest water in Utah — the story behind a Holiday signature.',
        body: [
            block(
                'When the water comes up in Cataract Canyon, Holiday boatmen do something that turns heads at every put-in: they lash three rafts together, side by side, and row the whole thing through the biggest rapids in Utah.',
            ),
            block(
                'The triple rig is a piece of living history. It gives the stability of a much larger boat while staying true to the company’s founding commitment — no motors, ever. Just oars, current, and a crew that knows how to read water.',
            ),
            block(
                'Dee Holladay built the company on that oar-powered philosophy, and the practices he pioneered were later folded into Leave No Trace protocols adopted across the West. The triple rig is what that philosophy looks like when the river gets big.',
            ),
        ],
    },
    {
        _id: 'post-packing-for-your-trip',
        title: 'Packing for Your Trip',
        slug: 'packing-for-your-trip',
        category: 'trip-prep',
        publishedAt: '2026-06-20T09:00:00Z',
        excerpt:
            'Two dry bags, one golden rule: if you need it during the day, it goes in the small one.',
        body: [
            block(
                'Every guest gets two waterproof bags. The large one holds everything you need only at camp — sleeping bag, dry clothes, toiletries. The small day bag rides where you can reach it, and holds the things you’ll actually want on the water: sunscreen, camera, rain gear.',
            ),
            block(
                'Holiday provides the big stuff: a Coast Guard-approved life jacket, kitchen and dining gear, a camp chair for every guest, and Farmer John wetsuits on the early-season trips that call for them.',
            ),
            block(
                'Skip the glass (boxed wine travels beautifully), pack layers even in July, and remember desert nights get cold. Your confirmation packet includes the full list — and if you’ve never camped before, don’t sweat it: beyond pitching your own tent, the guides handle everything.',
            ),
        ],
    },
    {
        _id: 'post-stargazing-on-the-river',
        title: 'Stargazing on the River',
        slug: 'stargazing-on-the-river',
        category: 'conservation',
        publishedAt: '2026-06-27T09:00:00Z',
        excerpt:
            'The canyons Holiday runs sit under some of the darkest skies in the lower 48 — here’s why that matters.',
        body: [
            block(
                'The Colorado Plateau holds some of the last truly dark skies in the contiguous United States. Deep in Desolation or Cataract Canyon, hundreds of river miles from the nearest city glow, the Milky Way isn’t a faint smudge — it casts shadows.',
            ),
            block(
                'It’s why Holiday runs a Dark Sky trip series with astronomers and telescopes on the beach, timed to new moons. But every multi-day trip gets the show: no motors means no generator hum, and no light pollution means the night sky is part of the itinerary whether it’s on the brochure or not.',
            ),
            block(
                'Dark skies are a conservation issue like clean water is. The same stewardship that keeps these canyons wild — Leave No Trace camps, protected river corridors — is what keeps their nights dark.',
            ),
        ],
    },
].map((p) => ({
    _type: 'post',
    _id: p._id,
    title: p.title,
    slug: slug(p.slug),
    excerpt: p.excerpt,
    category: p.category,
    publishedAt: p.publishedAt,
    body: p.body,
}));

async function run() {
    const tx = client.transaction();
    for (const doc of posts) tx.createOrReplace(doc);
    await tx.commit();
    console.log(`Seeded ${posts.length} blog posts.`);
}

run().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
