import { defineField, defineType } from 'sanity';

const MONTHS = [
    { title: 'January', value: 1 },
    { title: 'February', value: 2 },
    { title: 'March', value: 3 },
    { title: 'April', value: 4 },
    { title: 'May', value: 5 },
    { title: 'June', value: 6 },
    { title: 'July', value: 7 },
    { title: 'August', value: 8 },
    { title: 'September', value: 9 },
    { title: 'October', value: 10 },
    { title: 'November', value: 11 },
    { title: 'December', value: 12 },
];

export const trip = defineType({
    name: 'trip',
    title: 'Trip',
    type: 'document',
    groups: [
        { name: 'basics', title: 'Basics', default: true },
        { name: 'card', title: 'Card' },
        { name: 'details', title: 'Trip Details' },
        { name: 'facts', title: 'Quick Facts' },
        { name: 'booking', title: 'Booking' },
        { name: 'finder', title: 'Trip Finder' },
        { name: 'specialty', title: 'Specialty' },
    ],
    fields: [
        // --- Basics ---
        defineField({
            name: 'name',
            title: 'Trip Name',
            type: 'string',
            group: 'basics',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            group: 'basics',
            options: { source: 'name', maxLength: 96 },
            description:
                'Sets the page URL, e.g. "westwater-canyon" serves /trips/westwater-canyon. Avoid changing it once the page is live.',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'river',
            title: 'Section',
            type: 'reference',
            group: 'basics',
            to: [{ type: 'river' }],
            description:
                'The stretch of river or country this trip runs — Westwater, Cataract, White Rim.',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'tripType',
            title: 'Trip Type',
            type: 'reference',
            group: 'basics',
            to: [{ type: 'tripType' }],
            description:
                'Rafting, Biking, or Combo. Decides which landing page lists this trip and which coloured tag its card carries.',
            validation: (rule) => rule.required(),
        }),

        // --- Card ---
        defineField({
            name: 'tagline',
            title: 'Card Tagline',
            type: 'string',
            group: 'card',
            description:
                'One-line summary on trip cards, and the lead line on the trip page.',
        }),
        defineField({
            name: 'startingPrice',
            title: 'Starting Price (display)',
            type: 'string',
            group: 'card',
            description:
                'Shown as "Starts at …" on cards, e.g. "$1,630". Typed by hand — live per-departure pricing comes from Arctic, so keep this in step with the season’s lowest price.',
        }),
        defineField({
            name: 'durationLabel',
            title: 'Duration Label',
            type: 'string',
            group: 'card',
            description:
                'Display range on cards, e.g. "5/6 Days". The numeric Duration under Trip Finder is what the wizard matches against.',
        }),
        defineField({
            name: 'subtitle',
            title: 'Specialty Subtitle',
            type: 'string',
            group: 'card',
            description:
                'Optional red second line under the name on specialty cards (e.g. "With The Pickpockets Bluegrass").',
        }),
        defineField({
            name: 'ribbon',
            title: 'Specialty Ribbon',
            type: 'string',
            group: 'card',
            description:
                'Optional ribbon label on the card image (e.g. "Specialty Music Trip"). Cards with a ribbon get the red feature frame. Falls back to the first Specialty Type’s ribbon.',
        }),
        defineField({
            name: 'photos',
            title: 'Photos',
            type: 'array',
            group: 'card',
            description:
                'First photo is the card image and the page banner; the rest fill the gallery.',
            of: [
                {
                    type: 'image',
                    options: { hotspot: true },
                    fields: [
                        defineField({
                            name: 'alt',
                            title: 'Alt Text',
                            type: 'string',
                        }),
                        defineField({
                            name: 'caption',
                            title: 'Caption',
                            type: 'string',
                        }),
                    ],
                },
            ],
        }),

        // --- Quick facts (the bar under the banner) ---
        defineField({
            name: 'whoIsThisFor',
            title: 'Who’s This Trip For',
            type: 'string',
            group: 'facts',
            description:
                'Short phrase for the quick facts bar, e.g. "First-timers and families". Shown in place of Rapid Class on trips with no whitewater.',
            validation: (rule) => rule.max(48),
        }),
        defineField({
            name: 'meetingPlace',
            title: 'Meeting Place',
            type: 'string',
            group: 'facts',
            description:
                'Where guests meet on day one, e.g. "Green River, Utah". Shown in the quick facts bar.',
        }),
        defineField({
            name: 'deposit',
            title: 'Deposit',
            type: 'string',
            group: 'facts',
            description:
                'Deposit due at booking, e.g. "$300 per person". Shown in the quick facts bar.',
        }),
        defineField({
            name: 'minAge',
            title: 'Minimum Age',
            type: 'number',
            group: 'facts',
            validation: (rule) => rule.min(0).integer(),
        }),
        defineField({
            name: 'season',
            title: 'Season (display)',
            type: 'string',
            group: 'facts',
            description:
                'Free text for the quick facts bar, e.g. "May – September". Keep it in step with Season (months) under Trip Finder, which is what the wizard matches.',
        }),

        // --- Trip details (page body) ---
        defineField({
            name: 'description',
            title: 'Trip Description',
            type: 'array',
            group: 'details',
            of: [{ type: 'block' }],
            description:
                'Main copy in the Trip Details section of this trip’s page, at /trips/<slug>. This is the trip’s own story — the stretch of river it runs is described on the Section document instead.',
        }),
        defineField({
            name: 'highlights',
            title: 'Highlights',
            type: 'array',
            group: 'details',
            of: [{ type: 'string' }],
            description:
                'Short bullets listed beside the description, e.g. "Class IV rapids in Skull".',
        }),
        defineField({
            name: 'whatsIncluded',
            title: 'What’s Included',
            type: 'array',
            group: 'details',
            of: [{ type: 'string' }],
            description:
                'One line per item — meals, guides, gear, shuttles. Listed as a checklist on the trip page.',
        }),
        defineField({
            name: 'videoUrl',
            title: 'Video',
            type: 'url',
            group: 'details',
            description:
                'YouTube or Vimeo link, shown above the photo gallery.',
        }),
        defineField({
            name: 'itinerary',
            title: 'Itinerary',
            type: 'array',
            group: 'details',
            description: 'Day-by-day sample itinerary.',
            of: [
                {
                    type: 'object',
                    name: 'itineraryDay',
                    fields: [
                        defineField({
                            name: 'day',
                            title: 'Day Label',
                            type: 'string',
                            description: 'e.g. "Day 1" or "Days 2–3"',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'title',
                            title: 'Title',
                            type: 'string',
                        }),
                        defineField({
                            name: 'description',
                            title: 'Day Description',
                            type: 'text',
                            description: 'What happens on this day.',
                        }),
                    ],
                    preview: {
                        select: { title: 'day', subtitle: 'title' },
                    },
                },
            ],
        }),
        defineField({
            name: 'infoSections',
            title: 'Trip Info Sections',
            type: 'array',
            group: 'details',
            description:
                'Shared panels shown near the bottom of the trip page — Packing List, Getting Here, Before You Go. The text lives on the Trip Info Section document so one edit updates every trip; override it here only when this trip genuinely differs.',
            of: [
                {
                    type: 'object',
                    name: 'tripInfoSectionRef',
                    fields: [
                        defineField({
                            name: 'section',
                            title: 'Section',
                            type: 'reference',
                            to: [{ type: 'tripInfoSection' }],
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'overrideBody',
                            title: 'Override for This Trip',
                            type: 'array',
                            of: [{ type: 'block' }],
                            description:
                                'Leave empty to use the shared text. Anything here replaces it on this trip only.',
                        }),
                    ],
                    preview: {
                        select: {
                            title: 'section.title',
                            override: 'overrideBody',
                        },
                        prepare({ title, override }) {
                            return {
                                title: title ?? 'Section',
                                subtitle:
                                    override && override.length > 0
                                        ? 'Overridden for this trip'
                                        : 'Shared text',
                            };
                        },
                    },
                },
            ],
        }),
        defineField({
            name: 'featuredReview',
            title: 'Featured Review',
            type: 'object',
            group: 'details',
            description:
                'One standout guest quote, shown as a pull-quote band on the trip page.',
            fields: [
                defineField({ name: 'quote', title: 'Quote', type: 'text' }),
                defineField({
                    name: 'author',
                    title: 'Author',
                    type: 'string',
                }),
                defineField({
                    name: 'source',
                    title: 'Source',
                    type: 'string',
                    description: 'e.g. TripAdvisor, Google',
                }),
            ],
        }),
        defineField({
            name: 'faqs',
            title: 'Trip FAQs',
            type: 'array',
            group: 'details',
            description:
                'FAQ entries shown under "Good to Know" on this trip page. These come from the shared FAQ collection, so they also appear on /faq.',
            of: [{ type: 'reference', to: [{ type: 'faq' }] }],
        }),
        defineField({
            name: 'relatedTrips',
            title: 'Related Trips',
            type: 'array',
            group: 'details',
            description:
                'Curated "keep exploring" trips. Leave empty to auto-pick trips on the same section or of the same trip type.',
            of: [{ type: 'reference', to: [{ type: 'trip' }] }],
        }),

        // --- Booking ---
        defineField({
            name: 'arcticTripId',
            title: 'Arctic Trip Type ID(s)',
            type: 'string',
            group: 'booking',
            description:
                'Arctic Reservations trip-type id for live availability and booking. Comma-separate multiple ids when one trip page covers several Arctic trip types (e.g. "37,38" for Cataract 5-day + 6-day).',
        }),
        defineField({
            name: 'pricingNotes',
            title: 'Pricing Notes',
            type: 'text',
            group: 'booking',
            rows: 3,
            description:
                'Shown under Dates & Availability — what the price does and does not cover, group discounts, and similar caveats.',
        }),

        // --- Trip Finder matching data ---
        // Structured fields the /trip-finder wizard scores against. Display
        // strings (season, durationLabel) stay separate; these exist so
        // matching never has to parse prose. All optional — the wizard
        // treats missing data as unknown, not disqualifying.
        defineField({
            name: 'duration',
            title: 'Duration (days)',
            type: 'number',
            group: 'finder',
            description:
                'Longest option, as a number. The Duration Label under Card is what visitors actually see.',
            validation: (rule) => rule.min(1).integer(),
        }),
        defineField({
            name: 'maxRapidClass',
            title: 'Max Rapid Class',
            type: 'number',
            group: 'finder',
            description:
                'Biggest whitewater on the trip. Shown in the quick facts bar and matched by the wizard. Leave empty for trips with no whitewater — those show "Who’s This Trip For" in the same slot instead.',
            options: {
                list: [
                    { title: 'Class I — flat water', value: 1 },
                    { title: 'Class II — ripples and splashes', value: 2 },
                    { title: 'Class III — fun rapids', value: 3 },
                    { title: 'Class IV — big whitewater', value: 4 },
                    { title: 'Class V — expert', value: 5 },
                ],
                layout: 'radio',
            },
        }),
        defineField({
            name: 'seasonMonths',
            title: 'Season (months)',
            type: 'array',
            group: 'finder',
            of: [{ type: 'number' }],
            description:
                'Months this trip actually runs. Powers the wizard’s "when can you go" matching; the Season (display) field under Quick Facts is what visitors read.',
            options: { list: MONTHS },
        }),
        defineField({
            name: 'minAgeOverrides',
            title: 'Minimum Age Overrides',
            type: 'array',
            group: 'finder',
            description:
                'Months where the minimum age differs from the base Minimum Age — e.g. Cataract is 8, but 16 in May and June (spring high water).',
            of: [
                {
                    type: 'object',
                    name: 'minAgeOverride',
                    fields: [
                        defineField({
                            name: 'months',
                            title: 'Months',
                            type: 'array',
                            of: [{ type: 'number' }],
                            options: { list: MONTHS },
                            validation: (rule) => rule.required().min(1),
                        }),
                        defineField({
                            name: 'minAge',
                            title: 'Minimum Age in These Months',
                            type: 'number',
                            validation: (rule) =>
                                rule.required().min(0).integer(),
                        }),
                        defineField({
                            name: 'reason',
                            title: 'Reason',
                            type: 'string',
                            description: 'e.g. "spring high water"',
                        }),
                    ],
                    preview: {
                        select: { title: 'reason', subtitle: 'minAge' },
                    },
                },
            ],
        }),
        defineField({
            name: 'craftTypes',
            title: 'Craft Types',
            type: 'array',
            group: 'finder',
            of: [{ type: 'string' }],
            description:
                'Boats available on this trip. Trips with a range let guests dial their own thrill level (oar boat = mellow, inflatable kayak = max splash).',
            options: {
                list: [
                    { title: 'Oar raft', value: 'oar-raft' },
                    { title: 'Paddle raft', value: 'paddle-raft' },
                    {
                        title: 'Inflatable kayak',
                        value: 'inflatable-kayak',
                    },
                    { title: 'Stand-up paddleboard', value: 'sup' },
                ],
            },
        }),

        // --- Specialty trips ---
        defineField({
            name: 'specialtyTypes',
            title: 'Specialty Types',
            type: 'array',
            group: 'specialty',
            description:
                'Specialty families this trip belongs to (Canyon Concerts, Stargazing, ...). Flags the trip as specialty, lists it in that family’s section on /specialty, and supplies the card ribbon unless the Specialty Ribbon field overrides it.',
            of: [{ type: 'reference', to: [{ type: 'specialtyType' }] }],
        }),
        defineField({
            name: 'specialtyDepartures',
            title: 'Specialty Departures',
            type: 'array',
            group: 'specialty',
            description:
                'Call out individual dates in Dates & Availability — the September date that is the bluegrass trip, the new-moon date that is the stargazing trip. Leave empty when every departure of this trip is the same.',
            of: [
                {
                    type: 'object',
                    name: 'specialtyDeparture',
                    fields: [
                        defineField({
                            name: 'startDate',
                            title: 'Departure Start Date',
                            type: 'date',
                            options: { dateFormat: 'YYYY-MM-DD' },
                            description:
                                'Must match the departure’s start date in Arctic exactly. Matched by date rather than Arctic departure id because ids change year to year and are not visible to editors.',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'specialtyType',
                            title: 'Specialty Type',
                            type: 'reference',
                            to: [{ type: 'specialtyType' }],
                            description:
                                'Links the callout to that family’s section on /specialty.',
                        }),
                        defineField({
                            name: 'label',
                            title: 'Callout Label',
                            type: 'string',
                            description:
                                'Short badge text on the departure row, e.g. "With The Pickpockets".',
                            validation: (rule) => rule.required().max(48),
                        }),
                        defineField({
                            name: 'note',
                            title: 'Note',
                            type: 'text',
                            rows: 2,
                            description:
                                'Optional extra line shown under the date on this departure only.',
                        }),
                    ],
                    preview: {
                        select: { title: 'label', subtitle: 'startDate' },
                    },
                },
            ],
        }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'river.name',
            media: 'photos.0',
        },
    },
});
