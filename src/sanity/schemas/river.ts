import { defineField, defineType } from 'sanity';

export const river = defineType({
    name: 'river',
    title: 'River',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'riverName',
            title: 'River name (shown on trip cards)',
            type: 'string',
            description:
                'The actual river, e.g. "Colorado River" — sections like Cataract and Westwater both run the Colorado. Trip cards fall back to the section name above when this is empty (biking areas like Maze and White Rim can leave it blank).',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'name', maxLength: 96 },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'usgsSiteId',
            title: 'USGS gauge site number(s)',
            type: 'string',
            description:
                'Source for the live flow (CFS) chip. Comma-separate to sum gauges — Cataract adds Colorado near Cisco + Green at Green River, UT. Leave empty to hide the chip (biking areas).',
            validation: (rule) =>
                rule.regex(/^\s*\d{8,15}(\s*,\s*\d{8,15})*\s*$/, {
                    name: 'USGS site number list',
                    invert: false,
                }),
        }),
        defineField({
            name: 'flowLinkUrl',
            title: 'Flow graph link',
            type: 'url',
            description:
                'Where the flow chip links — e.g. the CBRFC forecast graph Holiday shares in pre-trip emails. Defaults to the USGS gauge page when empty.',
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'image',
            title: 'Image',
            type: 'image',
            options: { hotspot: true },
        }),
    ],
});
