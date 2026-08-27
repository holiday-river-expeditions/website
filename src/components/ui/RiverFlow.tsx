import { ExternalLink } from '@/components/ui/ExternalLink';
import {
    type FlowPoint,
    flowTrend,
    getRiverFlow,
    getRiverFlowSeries,
    usgsGaugeUrl,
} from '@/lib/usgs';

/**
 * Live river flow (CFS) from USGS, linking out to the flow graph Holiday
 * shares in pre-trip emails (CBRFC) or the USGS gauge page. Renders
 * nothing when the river has no gauge configured or the reading is
 * unavailable — flow is a bonus, never a broken slot.
 *
 * Next to the number sits a 7-day sparkline. Deliberately visible by
 * default rather than hover-revealed: hover doesn't exist on touch, and
 * the trend is the context that makes a raw CFS number meaningful. The
 * draw-in animation runs only under motion-safe, and the trend is
 * mirrored as screen-reader text ("7-day trend: rising"). The full
 * graph stays one click away on the linked page.
 *
 * Server component: both USGS fetches are cached ~30 minutes (see
 * lib/usgs), so ISR pages stay static and the data stays fresh enough.
 */

const cfsFormat = new Intl.NumberFormat('en-US');

const SPARK_W = 64;
const SPARK_H = 20;
const SPARK_PAD = 2;

function sparklinePoints(series: readonly FlowPoint[]): string | null {
    if (series.length < 2) return null;
    const values = series.map((point) => point.cfs);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return series
        .map((point, index) => {
            const x =
                SPARK_PAD +
                (index / (series.length - 1)) * (SPARK_W - SPARK_PAD * 2);
            const y =
                SPARK_H -
                SPARK_PAD -
                ((point.cfs - min) / span) * (SPARK_H - SPARK_PAD * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
}

function Sparkline({ series }: { series: readonly FlowPoint[] }) {
    const points = sparklinePoints(series);
    if (!points) return null;
    const trend = flowTrend(series);
    return (
        // The caption labels the data directly (Darius's note: an
        // unlabeled line doesn't say it covers 7 days) — never rely on
        // the reader inferring the window.
        <span className='flex shrink-0 flex-col items-center'>
            <svg
                aria-hidden
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                width={SPARK_W}
                height={SPARK_H}
            >
                <title>Daily average flow over the past 7 days</title>
                <polyline
                    points={points}
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    // pathLength normalizes the dash to 0..1 so one rule
                    // draws any line; animation is motion-safe only.
                    pathLength={1}
                    className='motion-safe:animate-spark-draw'
                />
            </svg>
            <span className='text-[12px] font-normal normal-case leading-none tracking-normal text-onyx/75'>
                past 7 days
            </span>
            {trend && <span className='sr-only'>7-day trend: {trend}</span>}
        </span>
    );
}

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
            <div>
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
                    <Sparkline series={series} />
                </dd>
            </div>
        );
    }

    return (
        <p className='flex items-center gap-2.5 text-body leading-body text-onyx'>
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
                <Sparkline series={series} />
            </span>
        </p>
    );
}
