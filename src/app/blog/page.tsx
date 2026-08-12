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
        'Stories from the canyon: trip preparation, conservation, and the culture and history of river country.',
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

            {/* Featured (latest) post — full-width band on sand */}
            {posts.length > 0 && (
                <Section background='sand' className='py-12 md:py-14'>
                    {(() => {
                        const featured = posts[0];
                        const href = featured.slug?.current
                            ? `/blog/${featured.slug.current}`
                            : '#';
                        const photo = imageUrl(featured.mainImage, 1200, 800);
                        return (
                            <Link
                                href={href}
                                className='group grid items-center gap-8 md:grid-cols-[1.2fr_1fr]'
                            >
                                <div className='relative aspect-[3/2] overflow-hidden bg-holiday-grey/15'>
                                    {photo && (
                                        <Image
                                            src={photo}
                                            alt={featured.title ?? ''}
                                            fill
                                            priority
                                            className='object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105'
                                            sizes='(max-width: 768px) 100vw, 60vw'
                                        />
                                    )}
                                </div>
                                <div>
                                    <span className='font-alt-gothic text-[13px] font-semibold uppercase tracking-[0.1em] text-onyx'>
                                        Latest Story
                                    </span>
                                    {/* leading-[0.9] is deliberate, not
                                        redundant: it sets --tw-leading, which
                                        md:text-h2 defers to, holding 0.9 at md
                                        instead of h2's 0.95. */}
                                    <h2 className='mt-2 font-alt-gothic text-section font-black uppercase leading-[0.9] text-onyx transition-opacity group-hover:opacity-70 md:text-h2'>
                                        {featured.title}
                                    </h2>
                                    {featured.excerpt && (
                                        <p className='mt-3 text-paragraph leading-paragraph text-onyx'>
                                            {featured.excerpt}
                                        </p>
                                    )}
                                    <span className='mt-4 inline-block font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.05em] text-holiday-red'>
                                        Read the Story →
                                    </span>
                                </div>
                            </Link>
                        );
                    })()}
                </Section>
            )}

            <Section background='white' className='pb-20 pt-12 md:pb-24'>
                {posts.length === 0 ? (
                    <p className='text-body leading-body text-onyx/70'>
                        Posts coming soon. Add them in the Studio.
                    </p>
                ) : (
                    <div
                        data-reveal-stagger
                        className='grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                    >
                        {posts.slice(1).map((post) => {
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
                                                    className='object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105'
                                                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                                                />
                                            )}
                                        </div>
                                        {category && (
                                            <span className='mt-4 inline-block bg-teal px-3.5 py-1.5 text-[14px] font-bold leading-tight text-holiday-white'>
                                                {category}
                                            </span>
                                        )}
                                        <h2 className='mt-3 font-alt-gothic text-h3 font-black uppercase leading-h3 text-onyx transition-opacity group-hover:opacity-70'>
                                            {post.title}
                                        </h2>
                                        {post.publishedAt && (
                                            <p className='mt-1 text-[13px] uppercase tracking-wider text-onyx/70'>
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
