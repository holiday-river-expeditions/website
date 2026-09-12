import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TripTypeLanding } from '@/components/ui/TripTypeLanding';
import { getAllTrips, getTripTypeBySlug } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
    const tripType = await getTripTypeBySlug('biking');
    if (!tripType) return {};
    return {
        title: tripType.name ?? undefined,
        description: tripType.description ?? undefined,
    };
}

export default async function BikingPage() {
    const [tripType, allTrips] = await Promise.all([
        getTripTypeBySlug('biking'),
        getAllTrips(),
    ]);
    if (!tripType) notFound();
    return <TripTypeLanding tripType={tripType} allTrips={allTrips} />;
}
