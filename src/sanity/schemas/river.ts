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
