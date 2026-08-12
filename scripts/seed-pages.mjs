/**
 * Seeds the Sanity `production` dataset with the content pages that back the
 * nav/footer links: About + Trip Insurance (page builder docs), FAQs, the
 * Site Settings singleton, and the Rafting/Biking activity docs. Also patches
 * each trip's empty `activities` array from its category so the activity
 * landing pages have trips to show (patch, not createOrReplace — trips carry
 * photos uploaded in /studio that must survive reseeding).
 *
 * Copy is abbreviated from bikeraft.com (the client's own site) per the manual
 * content-migration decision in docs/project/open-decisions.md.
 *
 * Idempotent: deterministic _ids + createOrReplace; trip patches skip trips
 * that already have activities set.
 *
 * Run from website/:  node scripts/seed-pages.mjs
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

/** One portable-text paragraph (or styled block) from a plain string. */
function block(text, style = 'normal') {
    return {
        _type: 'block',
        _key: key('block'),
        style,
        markDefs: [],
        children: [{ _type: 'span', _key: key('span'), text, marks: [] }],
    };
}

function bullets(items) {
    return items.map((text) => ({
        ...block(text),
        listItem: 'bullet',
        level: 1,
    }));
}

// --- Activities ---
const activities = [
    {
        _type: 'activity',
        _id: 'activity-rafting',
        name: 'River Rafting',
        slug: slug('rafting'),
        description:
            'Multi-day oar-powered rafting expeditions on the Green, Colorado, Yampa, and San Juan rivers. No motors, ever. Just the current, the canyon, and the crew.',
    },
    {
        _type: 'activity',
        _id: 'activity-biking',
        name: 'Mountain Biking',
        slug: slug('biking'),
        description:
            'Fully supported mountain bike tours on the White Rim Trail, the Maze, and the San Rafael Swell, plus bike-raft combination trips found nowhere else.',
    },
];

// --- Pages (page-builder docs rendered by app/[slug]) ---
const aboutPage = {
    _type: 'page',
    _id: 'page-about',
    title: 'About Holiday River Expeditions',
    slug: slug('about'),
    content: [
        {
            _type: 'heroBlock',
            _key: key('hero'),
            heading: 'Our Story',
            subheading: 'Family-run river outfitters since 1966',
            ctaText: 'Browse Trips',
            ctaLink: '/trips',
        },
        {
            _type: 'contentBlock',
            _key: key('content'),
            heading: 'Rafting Since 1966',
            body: [
                block(
                    'Dee Holladay took his first river trip in 1960, ran his first commercial trip two years later, and incorporated Holiday River Expeditions with his wife Sue in 1966. What began as a weekend operation became full-time summer expeditions by 1968, with headquarters established in Green River, Utah in 1973.',
                ),
                block(
                    'Six decades later, Holiday is still family-owned and still runs rivers the same way Dee did: oar-powered, motor-free, moving at the speed of the current. That choice shaped more than our trips. Dee’s outfitting practices and conservation policies were later adopted by the National Parks and Western land agencies as part of their Leave No Trace protocols.',
                ),
                block(
                    'From the Gates of Lodore and the Yampa to Cataract Canyon and the San Juan, we added mountain biking in 1991 and pioneered bike-raft combination trips in 1993. Dee was inducted into the River Runner’s Hall of Fame in 1998, and his legacy guides every trip we run.',
                ),
            ],
        },
        {
            _type: 'contentBlock',
            _key: key('content'),
            heading: 'The Holiday Way',
            body: [
                block(
                    'The Holiday Way is how we describe the philosophy Dee and Sue built the company on: flow with nature, practice humility, and do the work right the first time. It means celebrating the rain alongside the sunshine, and treating wild places as something we borrow, not own.',
                ),
                block(
                    'Our rafts move downstream using only current and oar power. Our guides train every year in river safety, wilderness first aid, interpretation, and inclusivity: skilled professionals and passionate storytellers in equal measure. And Sue’s standard for hospitality, from camp kitchens to quality meals, has been part of every expedition since 1966.',
                ),
            ],
        },
    ],
};

const tripInsurancePage = {
    _type: 'page',
    _id: 'page-trip-insurance',
    title: 'Cancellation Policy & Trip Insurance',
    slug: slug('trip-insurance'),
    content: [
        {
            _type: 'heroBlock',
            _key: key('hero'),
            heading: 'Cancellation & Trip Insurance',
            subheading: 'Policies for Utah & Colorado trips',
        },
        {
            _type: 'contentBlock',
            _key: key('content'),
            heading: 'Cancellation Policy',
            body: [
                block(
                    'A $400 per-person deposit reserves your seat and is due within 48 hours of booking. Full payment is due 90 days before your trip date.',
                ),
                ...bullets([
                    'Cancellations 90 or more days before your trip are refundable, less a service charge per person.',
                    'Cancellations within 90 days of your trip are non-refundable, including cancellations due to illness, injury, or travel delays.',
                    'If Holiday cancels a trip due to river conditions, weather, or insufficient reservations, you receive a full refund.',
                ]),
                block(
                    'Charter trips: the per-person deposit is due within 14 days of holding a date, full payment is due 90 days prior, and both are non-refundable.',
                ),
            ],
        },
        {
            _type: 'contentBlock',
            _key: key('content'),
            heading: 'Trip Insurance',
            body: [
                block(
                    'We strongly recommend trip cancellation insurance. Backcountry medical evacuations can cost $10,000 and up, and our cancellation policy cannot make exceptions for illness or injury.',
                ),
                ...bullets([
                    'Holiday guests commonly use Travel Guard (partners.travelguard.com, 1-877-249-5376), which covers evacuation, lost baggage, and cancellation.',
                    'Purchase within 7 days of your deposit to cover pre-existing conditions.',
                    'Company insurance does not cover personal items such as cameras, phones, or binoculars.',
                ]),
            ],
        },
    ],
};

// --- FAQs ---
const faqDefs = [
    // general
    {
        cat: 'general',
        q: 'What is a typical day on the river like?',
        a: 'Guides are up around 6 a.m. making coffee and breakfast, and we aim to push off the beach around 9 a.m., river time permitting. Days mix floating and whitewater with side hikes and a riverside lunch, and we make camp around 4–5 p.m.',
    },
    {
        cat: 'general',
        q: 'What is the guide-to-guest ratio?',
        a: 'Five guests to one guide is our standard ratio, and it is frequently closer to four to one.',
    },
    {
        cat: 'general',
        q: 'Can I try rowing or paddling?',
        a: 'Our guides are happy to give guests a chance to row. Most trips run guide-powered oar rafts; paddle boats are available on request when six to eight motivated paddlers want one.',
    },
    {
        cat: 'general',
        q: 'What if I have never camped before?',
        a: 'You only need to set up your tent and pick your campsite. The guides handle everything else, including all food preparation and cleanup.',
    },
    // booking
    {
        cat: 'booking',
        q: 'What deposit is required to book?',
        a: 'Utah and Colorado river and bike trips require a $400 per-person deposit to reserve your seat. Final payment is due 90 days before your trip.',
    },
    {
        cat: 'booking',
        q: 'How many people are needed for a trip to run?',
        a: 'Six full-paying guests guarantee a departure. Call us to confirm availability on the date you have in mind.',
    },
    {
        cat: 'booking',
        q: 'What is an appropriate tip for the guides?',
        a: 'The industry standard averages 10–15% of the trip cost, or roughly $30–$35 per guest per day. Hand your gratuity to the trip leader, who splits it evenly among the crew.',
    },
    // trip-preparation
    {
        cat: 'trip-preparation',
        q: 'What gear does Holiday provide?',
        a: 'We provide a U.S. Coast Guard-approved life jacket (PFD), waterproof bags, kitchen and dining gear, and a camp chair for each guest. Early-season trips that warrant them include Farmer John wetsuits.',
    },
    {
        cat: 'trip-preparation',
        q: 'How do the dry bags work?',
        a: 'You get two: a large bag for camp-only items and a small day bag for things you want on the water: sunscreen, camera, rain gear.',
    },
    {
        cat: 'trip-preparation',
        q: 'What about food and dietary needs?',
        a: 'Meals, ice water, lemonade or sports drink, and a daily soda are included, plus coffee, tea, and cocoa each morning. Return your guest data sheet at least 30 days before your trip so we can plan for dietary needs.',
    },
    {
        cat: 'trip-preparation',
        q: 'When should I arrive?',
        a: 'Arrive the day before your trip. Most trips hold a 7 p.m. pre-trip meeting the night before. Salt Lake City International is the most practical airport, about a three-hour drive from both Green River and Vernal.',
    },
    // safety
    {
        cat: 'safety',
        q: 'Do I need to know how to swim?',
        a: 'Many of our trips are appropriate for people who cannot swim, but every guest must be able to perform basic self-rescue: kicking to a boat and reaching for rescue ropes.',
    },
    {
        cat: 'safety',
        q: 'What are the essential eligibility criteria?',
        a: 'Guests must fit a Coast Guard-approved PFD (52-inch maximum chest, 50-pound minimum weight), board and exit boats safely, grip a rope, follow instructions, and manage their own hydration and nutrition.',
    },
    {
        cat: 'safety',
        q: 'What medical training do the guides have?',
        a: 'Holiday guides are trained in wilderness first aid and CPR, and every trip carries first aid kits and emergency communication devices.',
    },
    // cancellation
    {
        cat: 'cancellation',
        q: 'What is the cancellation policy?',
        a: 'Cancellations 90 or more days out are refundable less a per-person service charge. Cancellations within 90 days are non-refundable, so we strongly recommend trip insurance. If Holiday cancels a trip, you receive a full refund.',
    },
    {
        cat: 'cancellation',
        q: 'Does Holiday offer trip insurance?',
        a: 'We do not sell insurance directly, but strongly recommend purchasing coverage through a provider such as Travel Guard. See our Trip Insurance page for details.',
    },
];

const perCatCounter = {};
const faqs = faqDefs.map((f) => {
    perCatCounter[f.cat] = (perCatCounter[f.cat] ?? 0) + 1;
    return {
        _type: 'faq',
        _id: `faq-${f.cat}-${perCatCounter[f.cat]}`,
        question: f.q,
        answer: [block(f.a)],
        category: f.cat,
        order: perCatCounter[f.cat],
    };
});

// --- Site Settings singleton ---
const siteSettings = {
    _type: 'siteSettings',
    _id: 'siteSettings',
    phone: '801-266-2087',
    email: 'Info@HolidayExpeditions.com',
    address: '544 East 3900 South\nSalt Lake City, Utah 84107',
    socialLinks: {
        instagram: 'https://www.instagram.com/holidayriverexpeditions',
        facebook: 'https://www.facebook.com/HolidayRiverExpeditions',
        youtube: 'https://www.youtube.com/@holidayriverexpeditions',
    },
};

// --- Trip activity patches (category → activity) ---
const categoryToActivity = {
    'category-whitewater-rafting': 'activity-rafting',
    'category-mountain-biking': 'activity-biking',
};

async function run() {
    const docs = [
        ...activities,
        aboutPage,
        tripInsurancePage,
        ...faqs,
        siteSettings,
    ];
    const tx = client.transaction();
    for (const doc of docs) tx.createOrReplace(doc);
    await tx.commit();
    console.log(
        `Seeded: ${activities.length} activities, 2 pages, ${faqs.length} FAQs, 1 siteSettings singleton.`,
    );

    // Patch trips whose activities array is empty/unset, deriving from their
    // category. Never overwrites an editor-curated activities list.
    const trips = await client.fetch(
        `*[_type == "trip" && !defined(activities[0])]{ _id, "catRefs": categories[]._ref }`,
    );
    let patched = 0;
    for (const trip of trips) {
        const activityIds = [
            ...new Set(
                (trip.catRefs ?? [])
                    .map((c) => categoryToActivity[c])
                    .filter(Boolean),
            ),
        ];
        if (activityIds.length === 0) continue;
        await client
            .patch(trip._id)
            .set({
                activities: activityIds.map((id) => ({
                    _type: 'reference',
                    _ref: id,
                    _key: id,
                })),
            })
            .commit();
        patched++;
    }
    console.log(`Patched activities on ${patched} trips.`);
}

run().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
