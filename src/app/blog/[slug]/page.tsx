import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { getPostBySlug, imageUrl } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

interface PostPageProps {
    params: Promise<{ slug: string }>;
}

const categoryLabels: Record<string, string> = {
    'trip-prep': 'Trip Prep',
    conservation: 'Conservation',
    'culture-history': 'Culture & History',
};

const dateFormat = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

export async function generateMetadata({
    params,
}: PostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    if (!post) return {};
    return {
        title: post.title ?? undefined,
        description: post.excerpt ?? undefined,
    };
}

export default async function PostPage({ params }: PostPageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    if (!post) notFound();

    const heroPhoto = imageUrl(post.mainImage, 2000, 900);
    const category = post.category ? categoryLabels[post.category] : null;

    return (
        <>
            {/* Banner — inset like the homepage hero */}
            <section className='px-4 pt-3 md:px-10 md:pt-4'>
                <div className='relative flex h-[320px] items-end overflow-hidden bg-evergreen md:h-[440px]'>
                    {heroPhoto && (
                        <Image
                            src={heroPhoto}
                            alt={post.title ?? ''}
                            fill
                            priority
                            className='object-cover'
                            sizes='100vw'
                        />
                    )}
                    <div className='absolute inset-0 bg-gradient-to-t from-onyx/70 via-onyx/10 to-transparent' />
                    <div className='relative z-10 w-full px-6 pb-10 md:px-12'>
                        {category && (
                            <span className='inline-block bg-teal px-3 py-1 font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-holiday-white'>
                                {category}
                            </span>
                        )}
                        <h1 className='mt-3 font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                            {post.title}
                        </h1>
                        {post.publishedAt && (
                            <p className='mt-2 text-[13px] uppercase tracking-wider text-holiday-white/80'>
                                {dateFormat.format(new Date(post.publishedAt))}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <Section background='white' className='py-12 md:py-16'>
                <div className='mx-auto max-w-3xl'>
                    {post.body ? (
                        <div className='space-y-4 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline [&_h2]:font-alt-gothic [&_h2]:text-[36px] [&_h2]:font-black [&_h2]:uppercase [&_h2]:leading-[0.9] [&_h2]:text-holiday-red [&_h3]:font-alt-gothic [&_h3]:text-h3 [&_h3]:font-black [&_h3]:uppercase [&_h3]:leading-h3 [&_h3]:text-onyx [&_li]:ml-5 [&_ul]:list-disc'>
                            <PortableText value={post.body} />
                        </div>
                    ) : (
                        <p className='text-body leading-body text-onyx/70'>
                            Post body coming soon. Add it in the Studio.
                        </p>
                    )}
                    <div className='mt-12'>
                        <Button href='/blog' variant='outline'>
                            More From the Canyon
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
