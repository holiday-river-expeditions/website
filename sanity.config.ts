import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import type { StructureBuilder } from 'sanity/structure';
import { structureTool } from 'sanity/structure';
import { apiVersion, dataset, projectId } from '@/sanity/env';
import { schemaTypes } from '@/sanity/schemas';

const singletonTypes = new Set(['homepage', 'siteSettings', 'tripFinderSpec']);

/**
 * Grouped sidebar. The flat default list put the four taxonomies, the trip
 * documents and the two form-capture inboxes in one undifferentiated run,
 * which is how trip copy ended up on section documents.
 */
function structure(S: StructureBuilder) {
    const listFor = (type: string, title: string) =>
        S.listItem()
            .title(title)
            .id(type)
            .child(S.documentTypeList(type).title(title));

    return S.list()
        .title('Content')
        .items([
            listFor('trip', 'Trips'),

            S.divider(),

            S.listItem()
                .title('Pages & Posts')
                .id('pages')
                .child(
                    S.list()
                        .title('Pages & Posts')
                        .items([
                            listFor('page', 'Pages'),
                            listFor('post', 'Blog Posts'),
                            listFor('faq', 'FAQs'),
                            listFor('tripInfoSection', 'Trip Info Sections'),
                        ]),
                ),

            S.listItem()
                .title('Taxonomy')
                .id('taxonomy')
                .child(
                    S.list()
                        .title('Taxonomy')
                        .items([
                            listFor('river', 'Sections'),
                            listFor('tripType', 'Trip Types'),
                            listFor('specialtyType', 'Specialty Types'),
                        ]),
                ),

            S.divider(),

            S.listItem()
                .title('Homepage')
                .id('homepage')
                .child(
                    S.document()
                        .schemaType('homepage')
                        .documentId('homepage')
                        .title('Homepage'),
                ),
            S.listItem()
                .title('Site Settings')
                .id('siteSettings')
                .child(
                    S.document()
                        .schemaType('siteSettings')
                        .documentId('siteSettings')
                        .title('Site Settings'),
                ),
            S.listItem()
                .title('Trip Finder')
                .id('tripFinderSpec')
                .child(
                    S.document()
                        .schemaType('tripFinderSpec')
                        .documentId('tripFinderSpec')
                        .title('Trip Finder'),
                ),

            S.divider(),

            // Written by the contact and newsletter API routes. Read-only at
            // the schema level; grouped here so they read as an inbox rather
            // than as content anyone is expected to author.
            S.listItem()
                .title('Form Submissions')
                .id('submissions')
                .child(
                    S.list()
                        .title('Form Submissions')
                        .items([
                            listFor('contactSubmission', 'Contact Messages'),
                            listFor(
                                'newsletterSubscriber',
                                'Newsletter Signups',
                            ),
                        ]),
                ),
        ]);
}

export default defineConfig({
    basePath: '/studio',
    projectId,
    dataset,
    schema: {
        types: schemaTypes,
        // Singletons are reached through their pinned sidebar entries; keep
        // them out of global "create new" so a second Homepage can't appear.
        templates: (prev) =>
            prev.filter((t) => !singletonTypes.has(t.schemaType)),
    },
    document: {
        actions: (prev, { schemaType }) =>
            singletonTypes.has(schemaType)
                ? prev.filter(
                      ({ action }) =>
                          action !== 'duplicate' &&
                          action !== 'delete' &&
                          action !== 'unpublish',
                  )
                : prev,
    },
    plugins: [
        structureTool({ structure }),
        visionTool({ defaultApiVersion: apiVersion }),
    ],
});
