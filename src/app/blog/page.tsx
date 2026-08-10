import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import { getAllPosts, imageUrl } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Blog',
    description:
        'Stories from the canyon — trip preparation, conservation, and the culture and history of river country.',
};

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

export default async function BlogPage() {
    const posts = await getAllPosts();

    return (
        <>
            <Section background='white' className='pb-4 pt-14 md:pt-20'>
                <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    From the Canyon
                </h1>
                <p className='mt-4 max-w-2xl text-paragraph leading-paragraph text-onyx'>
                    Trip preparation, conservation, and stories from six decades
                    on the river.
                </p>
            </Section>

            <Section background='white' className='pb-20 pt-8 md:pb-24'>
                {posts.length === 0 ? (
                    <p className='text-body leading-body text-onyx/60'>
                        Posts coming soon — add them in the Studio.
                    </p>
                ) : (
                    <div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-3'>
                        {posts.map((post) => {
                            const href = post.slug?.current
                                ? `/blog/${post.slug.current}`
                                : '#';
                            const photo = imageUrl(post.mainImage, 760, 500);
                            const category = post.category
                                ? categoryLabels[post.category]
                                : null;
                            return (
                                <article key={post._id}>
                                    <Link href={href} className='group block'>
                                        <div className='relative aspect-[3/2] overflow-hidden bg-holiday-grey/15'>
                                            {photo && (
                                                <Image
                                                    src={photo}
                                                    alt={post.title ?? ''}
                                                    fill
                                                    className='object-cover transition-transform duration-500 group-hover:scale-105'
                                                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                                                />
                                            )}
                                        </div>
                                        {category && (
                                            <span className='mt-4 inline-block bg-teal px-3 py-1 font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-holiday-white'>
                                                {category}
                                            </span>
                                        )}
                                        <h2 className='mt-3 font-alt-gothic text-h3 font-black uppercase leading-h3 text-onyx transition-opacity group-hover:opacity-70'>
                                            {post.title}
                                        </h2>
                                        {post.publishedAt && (
                                            <p className='mt-1 text-[13px] uppercase tracking-wider text-holiday-grey'>
                                                {dateFormat.format(
                                                    new Date(post.publishedAt),
                                                )}
                                            </p>
                                        )}
                                        {post.excerpt && (
                                            <p className='mt-2 text-body leading-body text-onyx/80'>
                                                {post.excerpt}
                                            </p>
                                        )}
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                )}
            </Section>
        </>
    );
}
