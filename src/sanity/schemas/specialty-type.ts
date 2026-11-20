import { defineField, defineType } from 'sanity';
import { richTextOf } from './blocks/divider';

/**
 * A family of specialty trips — Canyon Concerts, Dark Sky Stargazing,
 * Women's, and so on. The legacy site gave each family its own URL parent
 * (see docs/project/site-audit.md). This type is the replacement: a section
 * of the /specialty hub with its own copy and photo, holding the dates that
 * its Arctic keywords tag and the specialtyDepartures entries that name it.
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
            of: richTextOf,
            description: 'Body copy for the parent page.',
        }),
        defineField({
            name: 'image',
            title: 'Image',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'arcticKeywords',
            title: 'Arctic Keywords',
            type: 'array',
            of: [{ type: 'string' }],
            options: { layout: 'tags' },
            description:
                'Keywords on Arctic departures that put a date in this family, such as MT for music trips. A date that is bookable online and has one of these keywords shows as a specialty date, with its Arctic name as the label. If a date has keywords from two families, the family that comes first in Order wins.',
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
