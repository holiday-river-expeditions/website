import { ExternalLink } from '@/components/ui/ExternalLink';
import { getRiverFlow, usgsGaugeUrl } from '@/lib/usgs';

/**
 * Live river flow (CFS) from USGS, linking out to the flow graph Holiday
 * shares in pre-trip emails (CBRFC) or the USGS gauge page. Renders
 * nothing when the river has no gauge configured or the reading is
 * unavailable — flow is a bonus, never a broken slot.
 *
 * Server component: the USGS fetch is cached ~30 minutes (see lib/usgs),
 * so ISR pages stay static and the number stays reasonably fresh.
 */

const cfsFormat = new Intl.NumberFormat('en-US');

export async function RiverFlow({
    siteIds,
    href,
    variant,
}: {
    /** Comma-separated USGS site number(s); empty/invalid renders nothing. */
    siteIds: string | null | undefined;
    /** Authored flow-graph link; defaults to the first gauge's USGS page. */
    href?: string | null;
    /** 'fact' matches the trip fact bar's dt/dd styling; 'inline' is a
        standalone line for river pages. */
    variant: 'fact' | 'inline';
}) {
    const flow = await getRiverFlow(siteIds);
    if (!flow || !siteIds) return null;

    const link = href ?? usgsGaugeUrl(siteIds);
    const reading = `${cfsFormat.format(flow.cfs)} CFS`;

    if (variant === 'fact') {
        return (
            <div>
                <dt className='font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-onyx/70'>
                    River Flow
                </dt>
                <dd className='mt-1 font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-holiday-red'>
                    <ExternalLink
                        href={link}
                        className='transition-opacity hover:opacity-70'
                    >
                        {reading}
                    </ExternalLink>
                </dd>
            </div>
        );
    }

    return (
        <p className='text-body leading-body text-onyx'>
            Current flow:{' '}
            <ExternalLink
                href={link}
                className='font-bold text-holiday-red transition-opacity hover:opacity-70'
            >
                {reading}
            </ExternalLink>
        </p>
    );
}
