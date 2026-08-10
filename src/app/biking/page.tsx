import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ActivityLanding } from '@/components/ui/ActivityLanding';
import { getActivityBySlug } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
    const activity = await getActivityBySlug('biking');
    if (!activity) return {};
    return {
        title: activity.name ?? undefined,
        description: activity.description ?? undefined,
    };
}

export default async function BikingPage() {
    const activity = await getActivityBySlug('biking');
    if (!activity) notFound();
    return <ActivityLanding activity={activity} />;
}
