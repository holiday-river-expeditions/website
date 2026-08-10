import { defineField, defineType } from 'sanity';

/**
 * A newsletter signup from the footer form. Created by the /api/newsletter
 * route — not authored in the Studio. Interim store until an email provider
 * is chosen (see docs/project/open-decisions.md); export and import there.
 */
export const newsletterSubscriber = defineType({
    name: 'newsletterSubscriber',
    title: 'Newsletter Subscriber',
    type: 'document',
    readOnly: true,
    fields: [
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
        }),
        defineField({
            name: 'subscribedAt',
            title: 'Subscribed At',
            type: 'datetime',
        }),
    ],
    preview: {
        select: { title: 'email', subtitle: 'subscribedAt' },
    },
    orderings: [
        {
            title: 'Newest First',
            name: 'newestFirst',
            by: [{ field: 'subscribedAt', direction: 'desc' }],
        },
    ],
});
