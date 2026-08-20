import { defineField, defineType } from 'sanity';

/**
 * A family of specialty trips — Canyon Concerts, Dark Sky Stargazing,
 * Women's, and so on. The legacy site gave each family its own URL parent
 * (see docs/project/site-audit.md); this type is the replacement, and it does
 * three jobs at once:
 *
 *  1. flags a trip as specialty (trip.specialtyTypes)
 *  2. backs the /specialty hub linked from the nav
 *  3. renders its own parent page at /specialty/[slug]
 */
export const specialtyType = defineType({
    name: 'specialtyType',
    title: 'Specialty Type',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
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
            name: 'tagline',
            title: 'Tagline',
            type: 'string',
            description:
                'One line shown under the name on the hub and the parent page.',
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'array',
            of: [{ type: 'block' }],
            description: 'Body copy for the parent page.',
        }),
        defineField({
            name: 'image',
            title: 'Image',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'ribbonLabel',
            title: 'Card Ribbon Label',
            type: 'string',
            description:
                'Ribbon text on trip cards in this family, e.g. "Specialty Music Trip". A trip\'s own Specialty Ribbon field overrides this.',
        }),
        defineField({
            name: 'order',
            title: 'Order',
            type: 'number',
            description:
                'Sort position on the /specialty hub. Lower numbers come first.',
            validation: (rule) => rule.integer(),
        }),
    ],
    orderings: [
        {
            name: 'orderAsc',
            title: 'Display order',
            by: [
                { field: 'order', direction: 'asc' },
                { field: 'name', direction: 'asc' },
            ],
        },
    ],
    preview: {
        select: { title: 'name', subtitle: 'tagline', media: 'image' },
    },
});
