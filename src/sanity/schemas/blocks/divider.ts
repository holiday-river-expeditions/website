import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * A horizontal rule editors can drop between paragraphs (Justin, Sep 10:
 * "add horizontal lines as an option in the text editor"). Sanity wants
 * every object to carry a field, so `style` exists with a single choice.
 */
export const divider = defineType({
    name: 'divider',
    title: 'Horizontal Rule',
    type: 'object',
    fields: [
        defineField({
            name: 'style',
            title: 'Style',
            type: 'string',
            initialValue: 'line',
            options: { list: [{ title: 'Line', value: 'line' }] },
        }),
    ],
    preview: {
        prepare: () => ({ title: '— Horizontal rule —' }),
    },
});

/**
 * The block content every rich text field accepts: paragraphs plus the
 * horizontal rule. Used for the `of` on each editor so they cannot drift.
 */
export const richTextOf = [
    defineArrayMember({ type: 'block' }),
    defineArrayMember({ type: 'divider' }),
];
