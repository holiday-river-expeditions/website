import Image from 'next/image';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Section } from '@/components/ui/Section';

/**
 * Compact social-proof strip: star rating + third-party review links + NPS
 * badge. Reviews live on TripAdvisor/Google per the reviews strategy — we
 * link out rather than self-host.
 */
export function TrustStrip({
    ratingLabel,
    tripadvisorUrl,
    googleUrl,
}: {
    ratingLabel: string;
    tripadvisorUrl?: string | null;
    googleUrl?: string | null;
}) {
    const linkStyle =
        'font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.05em] text-holiday-red transition-opacity hover:opacity-70';

    return (
        <Section background='opal' className='py-10 md:py-12'>
            <div
                data-reveal
                className='flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center'
            >
                <div className='flex items-center gap-3'>
                    <span
                        aria-hidden
                        className='text-[20px] leading-none text-holiday-red'
                    >
                        ★★★★★
                    </span>
                    <span className='font-alt-gothic text-[19px] font-semibold uppercase tracking-[0.03em] text-onyx'>
                        {ratingLabel}
                    </span>
                </div>
                <div className='flex items-center gap-6'>
                    {tripadvisorUrl && (
                        <ExternalLink
                            href={tripadvisorUrl}
                            className={linkStyle}
                        >
                            TripAdvisor
                        </ExternalLink>
                    )}
                    {googleUrl && (
                        <ExternalLink href={googleUrl} className={linkStyle}>
                            Google Reviews
                        </ExternalLink>
                    )}
                </div>
                <Image
                    src='/nps-authorized-concessioner.png'
                    alt='National Park Service Authorized Concessioner'
                    width={80}
                    height={100}
                    className='h-14 w-auto'
                />
            </div>
        </Section>
    );
}
