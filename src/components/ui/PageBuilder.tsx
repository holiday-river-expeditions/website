import { PortableText } from '@portabletext/react';
import type { PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { imageUrl } from '@/lib/sanity';
import type { PageBySlugQueryResult } from '@/sanity/types';

type PageContent = NonNullable<NonNullable<PageBySlugQueryResult>['content']>;
type PageBlock = PageContent[number];

// Inline images inside a content block's body render at reading width.
const portableComponents: PortableTextComponents = {
    types: {
        image: ({ value }) => {
            const src = imageUrl(value, 1400, 900);
            if (!src) return null;
            return (
                <div className='relative my-8 aspect-[3/2] overflow-hidden bg-holiday-grey/15'>
                    <Image
                        src={src}
                        alt=''
                        fill
                        className='object-cover'
                        sizes='(max-width: 768px) 100vw, 768px'
                    />
                </div>
            );
        },
    },
};

interface PageBuilderProps {
    content: PageContent;
}

export function PageBuilder({ content }: PageBuilderProps) {
    return (
        <>
            {content.map((block, index) => (
                <Block key={block._key} block={block} isFirst={index === 0} />
            ))}
        </>
    );
}

function Block({ block, isFirst }: { block: PageBlock; isFirst: boolean }) {
    switch (block._type) {
        case 'heroBlock':
            return <HeroBlockSection block={block} isFirst={isFirst} />;
        case 'contentBlock':
            return <ContentBlockSection block={block} />;
        default:
            return null;
    }
}

function HeroBlockSection({
    block,
    isFirst,
}: {
    block: Extract<PageBlock, { _type: 'heroBlock' }>;
    isFirst: boolean;
}) {
    const heroPhoto = imageUrl(block.backgroundImage, 2000, 900);
    // The first hero is the page's h1; any later hero demotes to h2.
    const Heading = isFirst ? 'h1' : 'h2';

    return (
        <section className='px-4 pt-3 md:px-10 md:pt-4'>
            <div className='relative flex h-[320px] items-end overflow-hidden bg-evergreen md:h-[440px]'>
                {heroPhoto && (
                    <Image
                        src={heroPhoto}
                        alt={block.heading ?? ''}
                        fill
                        priority={isFirst}
                        className='object-cover'
                        sizes='100vw'
                    />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-onyx/70 via-onyx/10 to-transparent' />
                <div className='relative z-10 w-full px-6 pb-10 md:px-12'>
                    <Heading className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                        {block.heading}
                    </Heading>
                    {block.subheading && (
                        <p className='mt-2 font-alt-gothic text-subheading font-black uppercase leading-[0.95] text-holiday-white'>
                            {block.subheading}
                        </p>
                    )}
                    {block.ctaText && block.ctaLink && (
                        <div className='mt-6'>
                            <Button href={block.ctaLink} size='lg'>
                                {block.ctaText}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function ContentBlockSection({
    block,
}: {
    block: Extract<PageBlock, { _type: 'contentBlock' }>;
}) {
    return (
        <Section background='white' className='py-12 md:py-16'>
            <div className='mx-auto max-w-3xl'>
                {block.heading && (
                    <h2 className='font-alt-gothic text-[36px] font-black uppercase leading-[0.9] text-holiday-red'>
                        {block.heading}
                    </h2>
                )}
                {block.body && (
                    <div className='mt-6 space-y-4 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline [&_h3]:font-alt-gothic [&_h3]:text-h3 [&_h3]:font-black [&_h3]:uppercase [&_h3]:leading-h3 [&_h3]:text-onyx [&_li]:ml-5 [&_ul]:list-disc'>
                        <PortableText
                            value={block.body}
                            components={portableComponents}
                        />
                    </div>
                )}
            </div>
        </Section>
    );
}
