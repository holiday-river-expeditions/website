import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageBuilder } from '@/components/ui/PageBuilder';
import { RESERVED_SLUGS } from '@/lib/reserved-slugs';
import { getPageBySlug } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

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
    return {
        title: page.title ?? undefined,
        alternates: { canonical: `/${slug}` },
    };
}

export default async function CmsPage({ params }: CmsPageProps) {
    const { slug } = await params;
    if (RESERVED_SLUGS.has(slug)) notFound();

    const page = await getPageBySlug(slug);
    if (!page) notFound();

    return <PageBuilder content={page.content ?? []} />;
}
