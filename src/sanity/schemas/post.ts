import { defineField, defineType } from 'sanity';

export const post = defineType({
    name: 'post',
    title: 'Blog Post',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
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
            name: 'excerpt',
            title: 'Excerpt',
            type: 'text',
            rows: 3,
            description: 'Short teaser shown on the blog index.',
        }),
        defineField({
            name: 'mainImage',
            title: 'Main Image',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published At',
            type: 'datetime',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'string',
            options: {
                list: [
                    { title: 'Trip Prep', value: 'trip-prep' },
                    { title: 'Conservation', value: 'conservation' },
                    {
                        title: 'Culture & History',
                        value: 'culture-history',
                    },
                ],
            },
        }),
        defineField({
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [{ type: 'block' }, { type: 'image' }],
        }),
    ],
    preview: {
        select: { title: 'title', subtitle: 'category', media: 'mainImage' },
    },
    orderings: [
        {
            title: 'Newest First',
            name: 'newestFirst',
            by: [{ field: 'publishedAt', direction: 'desc' }],
        },
    ],
});
