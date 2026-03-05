import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import type { StructureBuilder } from 'sanity/structure';
import { structureTool } from 'sanity/structure';
import { apiVersion, dataset, projectId } from '@/sanity/env';
import { schemaTypes } from '@/sanity/schemas';

const singletonTypes = new Set(['homepage', 'siteSettings']);

function structure(S: StructureBuilder) {
    const singletonItems = [
        S.listItem()
            .title('Homepage')
            .id('homepage')
            .child(S.document().schemaType('homepage').documentId('homepage')),
        S.listItem()
            .title('Site Settings')
            .id('siteSettings')
            .child(
                S.document()
                    .schemaType('siteSettings')
                    .documentId('siteSettings'),
            ),
    ];

    const defaultItems = S.documentTypeListItems().filter(
        (item) => !singletonTypes.has(item.getId() ?? ''),
    );

    return S.list()
        .title('Content')
        .items([...singletonItems, S.divider(), ...defaultItems]);
}

export default defineConfig({
    basePath: '/studio',
    projectId,
    dataset,
    schema: {
        types: schemaTypes,
    },
    plugins: [
        structureTool({ structure }),
        visionTool({ defaultApiVersion: apiVersion }),
    ],
});
