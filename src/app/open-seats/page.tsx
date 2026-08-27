import { redirect } from 'next/navigation';
import { parseMonthParam } from '@/lib/departures';

// The availability page lives at /book now — one canonical page for the
// Book Now CTA, the footer's Trip Dates link, and old Open Seats links.
// The month filter carries across so shared filtered URLs keep working.
export default async function OpenSeatsRedirect({
    searchParams,
}: {
    searchParams: Promise<{ month?: string | string[] }>;
}) {
    const month = parseMonthParam((await searchParams).month);
    redirect(month ? `/book?month=${month}` : '/book');
}
