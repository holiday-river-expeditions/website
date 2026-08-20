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
            name: 'itineraryMedia',
            title: 'Itinerary Media',
            type: 'object',
            description:
                'Optional ambient clip shown beside the day-by-day itinerary. The poster is used on its own when no video is set, so it is always required.',
            options: { collapsible: true, collapsed: true },
            fields: [
                defineField({
                    name: 'video',
                    title: 'Video Loop',
                    type: 'file',
                    options: { accept: 'video/mp4' },
                    description:
                        'Silent MP4, portrait 3:4, roughly 10–15s, under ~4MB. No audio track, no burned-in captions.',
                }),
                defineField({
                    name: 'poster',
                    title: 'Poster / Still',
                    type: 'image',
                    options: { hotspot: true },
                    description:
                        'Shown while the video loads, and on its own when no video is set.',
                    validation: (rule) => rule.required(),
                }),
                defineField({
                    name: 'alt',
                    title: 'Alt Text',
                    type: 'string',
                    description: 'Describes the scene for screen readers.',
                    validation: (rule) => rule.required(),
                }),
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
