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
