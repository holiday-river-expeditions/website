import { defineField, defineType } from 'sanity';

export const trip = defineType({
    name: 'trip',
    title: 'Trip',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Trip Name',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'name', maxLength: 96 },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'river',
            title: 'River',
            type: 'reference',
            to: [{ type: 'river' }],
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'activities',
            title: 'Activities',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'activity' }] }],
        }),
        defineField({
            name: 'categories',
            title: 'Categories',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'tripCategory' }] }],
        }),
        defineField({
            name: 'difficulty',
            title: 'Difficulty',
            type: 'string',
            options: {
                list: [
                    { title: 'Easy', value: 'easy' },
                    { title: 'Moderate', value: 'moderate' },
                    { title: 'Challenging', value: 'challenging' },
                    { title: 'Expert', value: 'expert' },
                ],
                layout: 'radio',
            },
        }),
        defineField({
            name: 'duration',
            title: 'Duration (days)',
            type: 'number',
            validation: (rule) => rule.min(1).integer(),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'array',
            of: [{ type: 'block' }],
        }),
        defineField({
            name: 'highlights',
            title: 'Highlights',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'minAge',
            title: 'Minimum Age',
            type: 'number',
            validation: (rule) => rule.min(0).integer(),
        }),
        defineField({
            name: 'season',
            title: 'Season',
            type: 'string',
            description: 'e.g. "May – September"',
        }),
        defineField({
            name: 'featuredReview',
            title: 'Featured Review',
            type: 'object',
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
            name: 'itinerary',
            title: 'Itinerary',
            type: 'array',
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
                            title: 'Description',
                            type: 'text',
                        }),
                    ],
                    preview: {
                        select: { title: 'day', subtitle: 'title' },
                    },
                },
            ],
        }),
        defineField({
            name: 'faqs',
            title: 'Trip FAQs',
            type: 'array',
            description: 'FAQ entries shown on this trip page.',
            of: [{ type: 'reference', to: [{ type: 'faq' }] }],
        }),
        defineField({
            name: 'relatedTrips',
            title: 'Related Trips',
            type: 'array',
            description:
                'Curated "keep exploring" trips. Leave empty to auto-pick trips on the same river or activity.',
            of: [{ type: 'reference', to: [{ type: 'trip' }] }],
        }),
        defineField({
            name: 'photos',
            title: 'Photos',
            type: 'array',
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
        defineField({
            name: 'pricingNotes',
            title: 'Pricing Notes',
            type: 'text',
            rows: 3,
            description:
                'Brief pricing info. Live pricing comes from Arctic API.',
        }),
        defineField({
            name: 'arcticTripId',
            title: 'Arctic Trip Type ID(s)',
            type: 'string',
            description:
                'Arctic Reservations trip-type id for live availability and booking. Comma-separate multiple ids when one trip page covers several Arctic trip types (e.g. "37,38" for Cataract 5-day + 6-day).',
        }),

        // --- Trip Finder matching data ---
        // Structured fields the /trip-finder wizard scores against. Display
        // strings (season, startingPrice) stay untouched; these exist so
        // matching never has to parse prose. All optional — the wizard
        // treats missing data as unknown, not disqualifying.
        defineField({
            name: 'maxRapidClass',
            title: 'Max Rapid Class',
            type: 'number',
            description:
                'Biggest whitewater on the trip, as a rapid class. Leave empty for non-rafting trips. (Also the working example for the difficulty-vs-rapid-class question — see docs.)',
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
            of: [{ type: 'number' }],
            description:
                'Months this trip actually runs. Powers the wizard’s "when can you go" matching; the free-text Season field above stays for display.',
            options: {
                list: [
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
                ],
            },
        }),
        defineField({
            name: 'minAgeOverrides',
            title: 'Minimum Age Overrides',
            type: 'array',
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
                            options: {
                                list: [
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
                                ],
                            },
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
            description:
                'Specialty families this trip belongs to (Canyon Concerts, Stargazing, ...). Flags the trip as specialty, lists it on /specialty, and supplies the card ribbon unless the Specialty Ribbon field below overrides it.',
            of: [{ type: 'reference', to: [{ type: 'specialtyType' }] }],
        }),
        defineField({
            name: 'specialtyDepartures',
            title: 'Specialty Departures',
            type: 'array',
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
                                'Must match the departure\u2019s start date in Arctic exactly. Matched by date rather than Arctic departure id because ids change year to year and are not visible to editors.',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'specialtyType',
                            title: 'Specialty Type',
                            type: 'reference',
                            to: [{ type: 'specialtyType' }],
                            description:
                                'Links the callout to a parent page under /specialty.',
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

        // --- Trip-card display fields (homepage grid, listings) ---
        defineField({
            name: 'tagline',
            title: 'Card Tagline',
            type: 'string',
            description:
                'One-line summary shown on trip cards (e.g. the homepage grid).',
        }),
        defineField({
            name: 'startingPrice',
            title: 'Starting Price (display)',
            type: 'string',
            description:
                'Display price shown as "Starts at …" on cards, e.g. "$1,630". Live pricing comes from Arctic.',
        }),
        defineField({
            name: 'durationLabel',
            title: 'Duration Label',
            type: 'string',
            description: 'Display range shown on cards, e.g. "5/6 Days".',
        }),
        defineField({
            name: 'subtitle',
            title: 'Specialty Subtitle',
            type: 'string',
            description:
                'Optional red second line under the name on specialty cards (e.g. "With The Pickpockets Bluegrass").',
        }),
        defineField({
            name: 'ribbon',
            title: 'Specialty Ribbon',
            type: 'string',
            description:
                'Optional ribbon label on the card image (e.g. "Specialty Music Trip"). Cards with a ribbon get the red feature frame.',
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
