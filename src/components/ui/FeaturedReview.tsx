import { Section } from '@/components/ui/Section';
import { TopoDivider } from '@/components/ui/TopoDivider';

/**
 * Pull-quote band for one standout guest review — immediate social proof
 * right after the fact bar (mirrors the current site's highest-converting
 * placement). Sand background per the section-rhythm system.
 */
export function FeaturedReview({
    quote,
    author,
    source,
}: {
    quote: string;
    author?: string | null;
    source?: string | null;
}) {
    return (
        <Section background='sand' className='relative py-14 md:py-16'>
            <figure data-reveal className='mx-auto max-w-3xl text-center'>
                <span
                    aria-hidden
                    className='font-alt-gothic text-[80px] font-black leading-[0.5] text-holiday-red'
                >
                    &ldquo;
                </span>
                <blockquote className='mt-2 font-alt-gothic text-h3 font-semibold uppercase leading-[1.15] text-onyx md:text-[32px]'>
                    {quote}
                </blockquote>
                {(author || source) && (
                    <figcaption className='mt-5 text-body font-bold uppercase tracking-wider text-onyx/80'>
                        {author}
                        {author && source && ' · '}
                        {source && <span>via {source}</span>}
                    </figcaption>
                )}
            </figure>
            <div className='absolute inset-x-0 bottom-0'>
                <TopoDivider variant='river' className='text-onyx/15' />
            </div>
        </Section>
    );
}
