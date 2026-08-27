import { ExternalLink } from '@/components/ui/ExternalLink';
import { FlowSparkline } from '@/components/ui/FlowSparkline';
import { getRiverFlow, getRiverFlowSeries, usgsGaugeUrl } from '@/lib/usgs';

/**
 * Live river flow (CFS) from USGS, linking out to the flow graph Holiday
 * shares in pre-trip emails (CBRFC) or the USGS gauge page. Renders
 * nothing when the river has no gauge configured or the reading is
 * unavailable — flow is a bonus, never a broken slot.
 *
 * Next to the number sits the 7-day sparkline (FlowSparkline, a small
 * client island): trend always visible, per-day values on point/tap.
 * The full graph stays one click away on the linked page.
 *
 * Server component: both USGS fetches are cached ~30 minutes (see
 * lib/usgs), so ISR pages stay static and the data stays fresh enough.
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
    const [flow, series] = await Promise.all([
        getRiverFlow(siteIds),
        getRiverFlowSeries(siteIds),
    ]);
    if (!flow || !siteIds) return null;

    const link = href ?? usgsGaugeUrl(siteIds);
    const reading = `${cfsFormat.format(flow.cfs)} CFS`;

    if (variant === 'fact') {
        return (
            // Demoed behind the river-flow flag: hidden for real visitors
            // until Holiday signs off. Data still renders server-side (the
            // fetches are cached), CSS picks visibility per browser.
            <div className='hidden [[data-demo-river-flow=on]_&]:block'>
                {/* "Now" is load-bearing: the dates below are future trips,
                    and this reading is today's conditions, not a forecast
                    for those dates. */}
                <dt className='font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-onyx/70'>
                    River Flow Now
                </dt>
                <dd className='mt-1 flex items-center gap-2.5 font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-holiday-red'>
                    <ExternalLink
                        href={link}
                        className='transition-opacity hover:opacity-70'
                    >
                        {reading}
                    </ExternalLink>
                    <FlowSparkline series={series} />
                </dd>
            </div>
        );
    }

    return (
        <p className='hidden items-center gap-2.5 text-body leading-body text-onyx [[data-demo-river-flow=on]_&]:flex'>
            <span>
                Current flow:{' '}
                <ExternalLink
                    href={link}
                    className='font-bold text-holiday-red transition-opacity hover:opacity-70'
                >
                    {reading}
                </ExternalLink>
            </span>
            <span className='text-holiday-red'>
                <FlowSparkline series={series} />
            </span>
        </p>
    );
}
