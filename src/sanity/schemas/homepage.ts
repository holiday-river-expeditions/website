import { defineField, defineType } from 'sanity';

export const homepage = defineType({
    name: 'homepage',
    title: 'Homepage',
    type: 'document',
    fields: [
        // Hero
        defineField({
            name: 'heroHeading',
            title: 'Hero Heading',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'heroSubheading',
            title: 'Hero Subheading',
            type: 'string',
        }),
        defineField({
            name: 'heroImage',
            title: 'Hero Background Image',
            type: 'image',
            options: { hotspot: true },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'heroCtaText',
            title: 'Hero CTA Button Text',
            type: 'string',
        }),
        defineField({
            name: 'heroCtaLink',
            title: 'Hero CTA Button Link',
            type: 'string',
        }),

        // The Holiday Way
        defineField({
            name: 'holidayWayTagline',
            title: '"The Holiday Way" Tagline',
            type: 'string',
            description:
                'Short tagline shown above the heading (e.g. "The Holiday Way")',
        }),
        defineField({
            name: 'holidayWayHeading',
            title: '"The Holiday Way" Heading',
            type: 'string',
            description: 'Main heading (e.g. "Go with the flow.")',
        }),
        defineField({
            name: 'holidayWayBody',
            title: '"The Holiday Way" Body Text',
            type: 'text',
            rows: 4,
        }),

        // Final CTA
        defineField({
            name: 'ctaHeading',
            title: 'Final CTA Heading',
            type: 'string',
        }),
        defineField({
            name: 'ctaSubheading',
            title: 'Final CTA Subheading',
            type: 'string',
        }),
        defineField({
            name: 'ctaImage',
            title: 'Final CTA Background Image',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'ctaButtonText',
            title: 'Final CTA Button Text',
            type: 'string',
        }),
        defineField({
            name: 'ctaButtonLink',
            title: 'Final CTA Button Link',
            type: 'string',
        }),
    ],
    preview: {
        prepare() {
            return { title: 'Homepage' };
        },
    },
});
