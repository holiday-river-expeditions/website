import { DepartureList } from '@/components/ui/DepartureList';
import { DepartureVariantChips } from '@/components/ui/DepartureVariantChips';
import { Section } from '@/components/ui/Section';
import { getBookableTripTypes, getUpcomingDepartures } from '@/lib/arctic';
import {
    detectVariants,
    formatDateRange,
    nextAvailable,
} from '@/lib/departures';

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

    // Trip types feed variant chip labels; only needed for multi-type trips.
    const multiType =
        departures !== null &&
        new Set(departures.map((d) => d.triptypeid)).size > 1;
    const tripTypes = multiType ? await getBookableTripTypes() : null;
    const variants = departures
        ? detectVariants(departures, tripTypes ?? undefined)
        : [];
    const next = departures ? nextAvailable(departures) : null;

    return (
        <Section background='white' className='pb-20 pt-0 md:pb-24'>
            <div data-availability className='max-w-4xl'>
                <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
                    <h2 className='font-alt-gothic text-[36px] font-black uppercase leading-[0.9] text-holiday-red'>
                        Dates &amp; Availability
                    </h2>
                    {next && (
                        <span className='inline-block bg-teal px-3 py-1.5 font-alt-gothic text-[13px] font-medium uppercase tracking-[0.05em] leading-none text-holiday-white'>
                            Next available:{' '}
                            {formatDateRange(next.start, next.duration)}
                        </span>
                    )}
                </div>
                {variants.length > 1 && (
                    <div className='mt-6'>
                        <DepartureVariantChips variants={variants} />
                    </div>
                )}
                <div className='mt-8'>
                    {departures === null ? (
                        <CallFallback message='Live availability is momentarily unavailable.' />
                    ) : departures.length === 0 ? (
                        <CallFallback message='No upcoming departures are listed online.' />
                    ) : (
                        <DepartureList
                            departures={departures}
                            showTripName={variants.length > 1}
                        />
                    )}
                </div>
            </div>
        </Section>
    );
}
