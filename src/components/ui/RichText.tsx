import type { PortableTextComponents } from '@portabletext/react';

/**
 * Shared Portable Text renderers for the Studio's rich text fields. The
 * `divider` block is the horizontal rule editors insert between
 * paragraphs (Justin, Sep 10); every other block falls through to the
 * library defaults. Pass as `components` wherever a rich text field is
 * rendered, otherwise the rule logs as an unknown block and disappears.
 */
export const richTextComponents: PortableTextComponents = {
    types: {
        divider: () => <hr className='my-6 border-0 border-t border-onyx/30' />,
    },
};
