import { defineField, defineType } from 'sanity';

/**
 * Shared trip-page content that is near-identical across the catalogue —
 * packing lists, directions, before-you-go notes. Written once here and
 * referenced by each trip, so a change to the packing list does not mean
 * editing twenty-five trips.
 *
 * A trip that genuinely differs overrides the body in place; see the
 * Trip document's "Trip Info Sections" field.
 */
export const tripInfoSection = defineType({
    name: 'tripInfoSection',
    title: 'Trip Info Section',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            description:
                'Heading on the collapsible panel, e.g. "Packing List".',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'title', maxLength: 96 },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [{ type: 'block' }],
            description:
                'The shared version, used by every trip that references this section unless that trip overrides it.',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'order',
            title: 'Order',
            type: 'number',
            description:
                'Default order on the trip page. A trip can reorder its own sections by rearranging the references.',
            validation: (rule) => rule.integer(),
        }),
    ],
    orderings: [
        {
            name: 'orderAsc',
            title: 'Display order',
            by: [
                { field: 'order', direction: 'asc' },
                { field: 'title', direction: 'asc' },
            ],
        },
    ],
    preview: {
        select: { title: 'title', subtitle: 'slug.current' },
    },
});
