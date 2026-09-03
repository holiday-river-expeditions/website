import { defineField, defineType } from 'sanity';

/**
 * The single rafting-vs-biking axis. Replaces the old Activity and Trip
 * Category types, which partitioned every trip identically under different
 * names — Activity drove the landing pages and the wizard, Trip Category
 * supplied the card tag, and nothing kept them in step.
 *
 * One document now owns the landing route, the card tag, and its colour.
 */
export const tripType = defineType({
    name: 'tripType',
    title: 'Trip Type',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            description:
                'Heading on the landing page and the label in the main navigation, e.g. "Rafting".',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'name', maxLength: 96 },
            description:
                'Sets the landing page URL, e.g. "rafting" serves /rafting.',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'cardLabel',
            title: 'Card Tag Label',
            type: 'string',
            description:
                'Text in the coloured tag on trip cards, when it should differ from the name — e.g. name "Rafting", tag "Whitewater Rafting". Falls back to the name.',
        }),
        defineField({
            name: 'tagColor',
            title: 'Card Tag Colour',
            type: 'string',
            description:
                'Fill colour for the card tag. Each trip type gets its own so the grids stay readable at a glance.',
            initialValue: 'teal',
            options: {
                list: [
                    { title: 'Teal', value: 'teal' },
                    { title: 'Sand', value: 'sand' },
                    { title: 'Evergreen', value: 'evergreen' },
                    { title: 'Holiday red', value: 'red' },
                ],
                layout: 'radio',
            },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'listsWith',
            title: 'Also List On',
            type: 'reference',
            to: [{ type: 'tripType' }],
            description:
                'Show these trips on another type’s landing page as well. Combo trips list with Biking (Aug 20 decision) while keeping their own tag.',
        }),
        defineField({
            name: 'description',
            title: 'Trip Type Description',
            type: 'text',
            rows: 3,
            description:
                'Intro paragraph at the top of the landing page for this type, e.g. /rafting.',
        }),
        defineField({
            name: 'image',
            title: 'Landing Page Image',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'order',
            title: 'Order',
            type: 'number',
            description:
                'Controls navigation order and the order of the landing pages. Lower numbers come first.',
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
        select: { title: 'name', subtitle: 'cardLabel', media: 'image' },
    },
});
