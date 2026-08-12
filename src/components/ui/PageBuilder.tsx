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
            const alt =
                typeof value === 'object' &&
                value !== null &&
                'alt' in value &&
                typeof value.alt === 'string'
                    ? value.alt
                    : '';
            return (
                <div className='relative my-8 aspect-[3/2] overflow-hidden bg-holiday-grey/15'>
                    <Image
                        src={src}
                        alt={alt}
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

// Auto-alternation for unset content-block backgrounds — "changing light on
// a river trip" per the design-review rhythm recommendation.
const RHYTHM = ['white', 'sand', 'white', 'opal'] as const;

export function PageBuilder({ content }: PageBuilderProps) {
    let contentIndex = 0;
    return (
        <>
            {content.map((block, index) => {
                const rhythmSlot =
                    block._type === 'contentBlock'
                        ? RHYTHM[contentIndex++ % RHYTHM.length]
                        : 'white';
                return (
                    <Block
                        key={block._key}
                        block={block}
                        isFirst={index === 0}
                        fallbackBackground={rhythmSlot}
                    />
                );
            })}
        </>
    );
}

type SectionBackground = 'white' | 'sand' | 'opal' | 'evergreen';

function Block({
    block,
    isFirst,
    fallbackBackground,
}: {
    block: PageBlock;
    isFirst: boolean;
    fallbackBackground: SectionBackground;
}) {
    switch (block._type) {
        case 'heroBlock':
            return <HeroBlockSection block={block} isFirst={isFirst} />;
        case 'contentBlock':
            return (
                <ContentBlockSection
                    block={block}
                    fallbackBackground={fallbackBackground}
                />
            );
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
    const heroPhoto = imageUrl(block.backgroundImage, 2560, 900);
    // The first hero is the page's h1; any later hero demotes to h2.
    const Heading = isFirst ? 'h1' : 'h2';

    return (
        <section>
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
    fallbackBackground,
}: {
    block: Extract<PageBlock, { _type: 'contentBlock' }>;
    fallbackBackground: SectionBackground;
}) {
    const background =
        (block.background as SectionBackground | undefined) ??
        fallbackBackground;
    const onDark = background === 'evergreen';
    return (
        <Section
            background={background}
            className={`py-12 md:py-16 ${onDark ? 'bg-topo' : ''}`}
        >
            <div data-reveal className='mx-auto max-w-3xl'>
                {block.heading && (
                    <h2
                        className={`font-alt-gothic text-section font-black uppercase ${onDark ? 'text-holiday-white' : 'text-holiday-red'}`}
                    >
                        {block.heading}
                    </h2>
                )}
                {block.body && (
                    <div
                        className={`mt-6 space-y-4 text-body leading-body [&_a]:underline [&_h3]:font-alt-gothic [&_h3]:text-h3 [&_h3]:font-black [&_h3]:uppercase [&_h3]:leading-h3 [&_li]:ml-5 [&_ul]:list-disc ${onDark ? 'text-holiday-white/90 [&_a]:text-holiday-white [&_h3]:text-holiday-white' : 'text-onyx [&_a]:text-holiday-red [&_h3]:text-onyx'}`}
                    >
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
