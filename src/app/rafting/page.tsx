import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TripTypeLanding } from '@/components/ui/TripTypeLanding';
import { getTripTypeBySlug } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
    const tripType = await getTripTypeBySlug('rafting');
    if (!tripType) return {};
    return {
        title: tripType.name ?? undefined,
        description: tripType.description ?? undefined,
    };
}

export default async function RaftingPage() {
    const tripType = await getTripTypeBySlug('rafting');
    if (!tripType) notFound();
    return <TripTypeLanding tripType={tripType} />;
}
