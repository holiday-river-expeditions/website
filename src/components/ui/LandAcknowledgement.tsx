import { PortableText } from '@portabletext/react';
import { richTextComponents } from '@/components/ui/RichText';

type RichTextValue = React.ComponentProps<typeof PortableText>['value'];

/**
 * One land acknowledgement per trip, boxed so it stands apart from the
 * trip copy, in the smaller muted register of a disclaimer (Sep 10
 * decision: "put a box around it, make the disclaimer look like a
 * disclaimer"). Renders nothing until the trip has one written.
 */
export function LandAcknowledgement({
    body,
}: {
    body: RichTextValue | null | undefined;
}) {
    if (!body || (Array.isArray(body) && body.length === 0)) return null;

    return (
        <aside
            aria-labelledby='land-acknowledgement-heading'
            className='mt-10 border border-onyx/30 px-5 py-4'
        >
            <h2
                id='land-acknowledgement-heading'
                className='font-alt-gothic text-[12px] font-medium uppercase leading-[1.3] tracking-[0.05em] text-onyx/70'
            >
                Land Acknowledgement
            </h2>
            <div className='mt-2 space-y-2 text-[14px] leading-[1.5] text-onyx/80 [&_a]:text-holiday-red [&_a]:underline'>
                <PortableText value={body} components={richTextComponents} />
            </div>
        </aside>
    );
}
