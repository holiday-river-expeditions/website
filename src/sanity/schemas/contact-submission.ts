import { defineField, defineType } from 'sanity';

/**
 * A message sent through the /contact form. Created by the /api/contact
 * route — not authored in the Studio, only read/triaged there.
 */
export const contactSubmission = defineType({
    name: 'contactSubmission',
    title: 'Contact Submission',
    type: 'document',
    readOnly: true,
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
        }),
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
        }),
        defineField({
            name: 'message',
            title: 'Message',
            type: 'text',
        }),
        defineField({
            name: 'submittedAt',
            title: 'Submitted At',
            type: 'datetime',
        }),
    ],
    preview: {
        select: { title: 'name', subtitle: 'submittedAt' },
    },
    orderings: [
        {
            title: 'Newest First',
            name: 'newestFirst',
            by: [{ field: 'submittedAt', direction: 'desc' }],
        },
    ],
});
