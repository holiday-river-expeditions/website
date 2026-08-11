import { defineField, defineType } from 'sanity';

export const contentBlock = defineType({
    name: 'contentBlock',
    title: 'Content Block',
    type: 'object',
    fields: [
        defineField({
            name: 'heading',
            title: 'Heading',
            type: 'string',
        }),
        defineField({
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [
                { type: 'block' },
                {
                    type: 'image',
                    fields: [
                        defineField({
                            name: 'alt',
                            title: 'Alt Text',
                            type: 'string',
                            description:
                                'Describes the image for screen readers.',
                        }),
                    ],
                },
            ],
        }),
    ],
    preview: {
        select: { title: 'heading' },
        prepare({ title }: { title?: string }) {
            return { title: title ?? 'Content Block' };
        },
    },
});
