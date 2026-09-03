import { defineField, defineType } from 'sanity';

/**
 * A stretch of river or country a trip runs — Westwater, Cataract, White Rim.
 *
 * The internal type stays `river` because the public route is /rivers/[slug]
 * and every existing document and reference is keyed to it. The Studio calls
 * it Section, because two of these (Maze, White Rim) are biking country with
 * no river at all.
 */
export const river = defineType({
    name: 'river',
    title: 'Section',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Section Name',
            type: 'string',
            description:
                'The stretch, as Holiday names it — "Westwater", "Cataract", "White Rim". Not the river; that goes below.',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'riverName',
            title: 'River Name',
            type: 'string',
            description:
                'The actual river, e.g. "Colorado River" — sections like Cataract and Westwater both run the Colorado. Shown on trip cards and at the top of this section’s page, falling back to the section name when empty (biking areas like Maze and White Rim can leave it blank).',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'name', maxLength: 96 },
            description:
                'Sets the page URL, e.g. "westwater" serves /rivers/westwater. Changing it also drops this section from the homepage map, which matches coordinates by slug.',
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
            title: 'Section Description',
            type: 'text',
            rows: 3,
            description:
                'Intro paragraph on this section’s own page, at /rivers/<slug>. Describes the stretch of river itself — a specific trip’s story belongs in Trip Description on the Trip document.',
        }),
        defineField({
            name: 'image',
            title: 'Image',
            type: 'image',
            options: { hotspot: true },
        }),
    ],
    preview: {
        select: { title: 'name', subtitle: 'riverName', media: 'image' },
    },
});
