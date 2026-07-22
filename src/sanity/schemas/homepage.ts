import { defineArrayMember, defineField, defineType } from 'sanity';

export const homepage = defineType({
    name: 'homepage',
    title: 'Homepage',
    type: 'document',
    groups: [
        { name: 'hero', title: 'Hero' },
        { name: 'trips', title: 'Featured Trips' },
        { name: 'story', title: 'Rafting Since 1966' },
        { name: 'rivers', title: 'River Selector' },
        { name: 'learn', title: 'Learn & Get Inspired' },
    ],
    fields: [
        // --- Hero ---
        defineField({
            name: 'heroHeading',
            title: 'Hero Heading',
            type: 'string',
            group: 'hero',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'heroImage',
            title: 'Hero Background Image',
            type: 'image',
            group: 'hero',
            options: { hotspot: true },
            description:
                'Full-width banner photo behind the hero headline. The 60-year seal is a fixed brand graphic and is not set here.',
            validation: (rule) => rule.required(),
        }),

        // --- Featured Trips grid ---
        defineField({
            name: 'featuredTrips',
            title: 'Featured Trips',
            type: 'array',
            group: 'trips',
            description:
                'Trips shown in the homepage grid, in this order. Drag to reorder.',
            of: [
                defineArrayMember({
                    type: 'reference',
                    to: [{ type: 'trip' }],
                }),
            ],
        }),

        // --- "Rafting Since 1966" story ---
        defineField({
            name: 'storyBody',
            title: 'Story Body Text',
            type: 'text',
            group: 'story',
            rows: 4,
            description:
                'Body copy beside the "Rafting Since 1966" heading. (The heading and the Dee Holladay signature are fixed brand elements.)',
        }),
        defineField({
            name: 'storyImageLeft',
            title: 'Story Photo — Left (vintage)',
            type: 'image',
            group: 'story',
            options: { hotspot: true },
        }),
        defineField({
            name: 'storyImagePortrait',
            title: 'Story Photo — Dee Holladay Portrait',
            type: 'image',
            group: 'story',
            options: { hotspot: true },
            description: 'B&W founder portrait the signature points to.',
        }),
        defineField({
            name: 'storyCtaText',
            title: 'Story Button Text',
            type: 'string',
            group: 'story',
        }),
        defineField({
            name: 'storyCtaLink',
            title: 'Story Button Link',
            type: 'string',
            group: 'story',
        }),

        // --- River selector ---
        defineField({
            name: 'rivers',
            title: 'Rivers',
            type: 'array',
            group: 'rivers',
            description:
                'Rivers listed in the selector, in this order. Drag to reorder.',
            of: [
                defineArrayMember({
                    type: 'reference',
                    to: [{ type: 'river' }],
                }),
            ],
        }),

        // --- Learn & Get Inspired ---
        defineField({
            name: 'learnContent',
            title: 'Learn & Get Inspired Cards',
            type: 'array',
            group: 'learn',
            of: [
                defineArrayMember({
                    type: 'object',
                    name: 'learnCard',
                    title: 'Card',
                    fields: [
                        defineField({
                            name: 'title',
                            title: 'Title',
                            type: 'string',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'image',
                            title: 'Image',
                            type: 'image',
                            options: { hotspot: true },
                        }),
                        defineField({
                            name: 'link',
                            title: 'Link',
                            type: 'string',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'isVideo',
                            title: 'Show Play Button (video)',
                            type: 'boolean',
                            initialValue: false,
                        }),
                    ],
                    preview: {
                        select: { title: 'title', media: 'image' },
                    },
                }),
            ],
        }),
    ],
    preview: {
        prepare() {
            return { title: 'Homepage' };
        },
    },
});
