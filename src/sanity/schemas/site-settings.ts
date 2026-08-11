import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
    name: 'siteSettings',
    title: 'Site Settings',
    type: 'document',
    fields: [
        defineField({
            name: 'phone',
            title: 'Phone Number',
            type: 'string',
        }),
        defineField({
            name: 'email',
            title: 'Email Address',
            type: 'string',
        }),
        defineField({
            name: 'address',
            title: 'Address',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'reviews',
            title: 'Reviews (third-party)',
            type: 'object',
            description:
                'Trust strip data — reviews live on TripAdvisor/Google per the reviews strategy; we link out, never self-host.',
            fields: [
                defineField({
                    name: 'ratingLabel',
                    title: 'Rating Label',
                    type: 'string',
                    description: 'e.g. "5.0 stars from 600+ reviews"',
                }),
                defineField({
                    name: 'tripadvisorUrl',
                    title: 'TripAdvisor URL',
                    type: 'url',
                }),
                defineField({
                    name: 'googleUrl',
                    title: 'Google Reviews URL',
                    type: 'url',
                }),
            ],
        }),
        defineField({
            name: 'socialLinks',
            title: 'Social Links',
            type: 'object',
            fields: [
                defineField({
                    name: 'facebook',
                    title: 'Facebook URL',
                    type: 'url',
                }),
                defineField({
                    name: 'instagram',
                    title: 'Instagram URL',
                    type: 'url',
                }),
                defineField({
                    name: 'youtube',
                    title: 'YouTube URL',
                    type: 'url',
                }),
                defineField({
                    name: 'tiktok',
                    title: 'TikTok URL',
                    type: 'url',
                }),
            ],
        }),
    ],
});
