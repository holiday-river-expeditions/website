import { DepartureList } from '@/components/ui/DepartureList';
import { Section } from '@/components/ui/Section';
import { getUpcomingDepartures } from '@/lib/arctic';

/**
 * "Dates & Availability" block on trip detail pages. Fetches live departures
 * from Arctic for the trip's arcticTripId(s). Degrades to a phone CTA when
 * Arctic is unconfigured, unreachable, or the trip has no mapping — the page
 * must always render (see docs/project/arctic-api.md, Resilience).
 */

function CallFallback({ message }: { message: string }) {
    return (
        <p className='max-w-2xl text-body leading-body text-onyx'>
            {message} Call{' '}
            <a
                href='tel:+18012662087'
                className='font-bold text-holiday-red transition-opacity hover:opacity-70'
            >
                801-266-2087
            </a>{' '}
            and we&rsquo;ll find the right date together.
        </p>
    );
}

interface AvailabilitySectionProps {
    arcticTripId: string | null;
}

export async function AvailabilitySection({
    arcticTripId,
}: AvailabilitySectionProps) {
    const departures = arcticTripId
        ? await getUpcomingDepartures(arcticTripId)
        : null;

    return (
        <Section background='white' className='pb-20 pt-0 md:pb-24'>
            <h2 className='font-alt-gothic text-[36px] font-black uppercase leading-[0.9] text-holiday-red'>
                Dates &amp; Availability
            </h2>
            <div className='mt-8 max-w-4xl'>
                {departures === null ? (
                    <CallFallback message='Live availability is momentarily unavailable.' />
                ) : departures.length === 0 ? (
                    <CallFallback message='No upcoming departures are listed online.' />
                ) : (
                    <DepartureList
                        departures={departures}
                        showTripName={departures.some(
                            (d) => d.triptypeid !== departures[0]?.triptypeid,
                        )}
                    />
                )}
            </div>
        </Section>
    );
}
