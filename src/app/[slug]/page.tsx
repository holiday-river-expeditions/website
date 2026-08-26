import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageBuilder } from '@/components/ui/PageBuilder';
import { getPageBySlug } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

// Slugs owned by dedicated routes (or reserved for ones on the roadmap).
// A `page` document with one of these slugs would be silently shadowed by
// the static route, so 404 it explicitly to keep behavior predictable.
const RESERVED_SLUGS = new Set([
    'admin',
    'api',
    'biking',
    'blog',
    'book',
    'contact',
    'faq',
    'open-seats',
    'rafting',
    'rivers',
    'specialty',
    'store',
    'studio',
    'trip-dates',
    'trips',
]);

interface CmsPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({
    params,
}: CmsPageProps): Promise<Metadata> {
    const { slug } = await params;
    if (RESERVED_SLUGS.has(slug)) return {};
    const page = await getPageBySlug(slug);
    if (!page) return {};
    return { title: page.title ?? undefined };
}

export default async function CmsPage({ params }: CmsPageProps) {
    const { slug } = await params;
    if (RESERVED_SLUGS.has(slug)) notFound();

    const page = await getPageBySlug(slug);
    if (!page) notFound();

    return <PageBuilder content={page.content ?? []} />;
}
