'use client';

import { useState } from 'react';
import { flowTrend, type FlowPoint } from '@/lib/usgs';

/**
 * 7-day flow sparkline with point inspection. The trend is always
 * visible (never hover-gated); pointing at the graphic is progressive
 * disclosure of the per-day values:
 *
 * - The WHOLE svg is the hit area, snapping to the nearest day — a
 *   64px-wide line is far too small a precision target (Fitts).
 * - Pointer events cover mouse hover and touch drag/tap alike.
 * - The caption line doubles as the readout ("Aug 24 · 3,400 CFS"),
 *   returning to "past 7 days" at rest — no floating tooltip to clip
 *   inside a 20px-tall graphic.
 * - Non-pointer users get the range and trend as screen-reader text;
 *   the linked CBRFC/USGS graph remains the full-detail view.
 */

const SPARK_W = 64;
const SPARK_H = 20;
const SPARK_PAD = 2;

const cfsFormat = new Intl.NumberFormat('en-US');

// "Aug 24" from "2026-08-24" — string parts, no Date, no timezone; the
// year is noise inside a 7-day window.
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
function dayLabel(date: string): string {
    const month = MONTHS[Number(date.slice(5, 7)) - 1] ?? date;
    return `${month} ${Number(date.slice(8, 10))}`;
}

function coords(series: readonly FlowPoint[]): Array<{ x: number; y: number }> {
    const values = series.map((point) => point.cfs);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return series.map((point, index) => ({
        x:
            SPARK_PAD +
            (index / (series.length - 1)) * (SPARK_W - SPARK_PAD * 2),
        y:
            SPARK_H -
            SPARK_PAD -
            ((point.cfs - min) / span) * (SPARK_H - SPARK_PAD * 2),
    }));
}

export function FlowSparkline({ series }: { series: FlowPoint[] }) {
    const [hovered, setHovered] = useState<number | null>(null);

    if (series.length < 2) return null;

    const points = coords(series);
    const polyline = points
        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ');
    const trend = flowTrend(series);
    const values = series.map((point) => point.cfs);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const active = hovered === null ? null : series[hovered];

    // The whole lockup (graph + caption) is the tracking surface, not the
    // 20px-tall svg (Darius: hovering the line itself was fiddly). Only
    // the horizontal position matters; x is clamped, so near-misses and
    // vertical drift still resolve to a day.
    function snapToNearest(event: React.PointerEvent<HTMLSpanElement>) {
        const svg = event.currentTarget.querySelector('svg');
        const rect = svg?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        const x = ((event.clientX - rect.left) / rect.width) * SPARK_W;
        const index = Math.round(
            ((x - SPARK_PAD) / (SPARK_W - SPARK_PAD * 2)) * (series.length - 1),
        );
        setHovered(Math.min(series.length - 1, Math.max(0, index)));
    }

    return (
        // The caption is absolutely positioned (with its height reserved
        // via padding) so the wider hover readout can't resize the lockup
        // under the cursor — that layout shift made edge-hover flicker as
        // the pointer fell in and out of the shrinking element.
        <span
            data-testid='spark-hit'
            className='relative flex shrink-0 cursor-crosshair touch-none flex-col items-center px-1.5 pb-[15px]'
            onPointerMove={snapToNearest}
            onPointerDown={snapToNearest}
            onPointerLeave={() => setHovered(null)}
        >
            <svg
                aria-hidden
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                width={SPARK_W}
                height={SPARK_H}
            >
                <title>Daily average flow over the past 7 days</title>
                <polyline
                    points={polyline}
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
                {hovered !== null && points[hovered] && (
                    <circle
                        cx={points[hovered].x}
                        cy={points[hovered].y}
                        r='2.5'
                        fill='currentColor'
                    />
                )}
            </svg>
            <span
                data-testid='spark-caption'
                className='absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-normal normal-case leading-none tracking-normal text-onyx/75'
            >
                {active
                    ? `${dayLabel(active.date)} · ${cfsFormat.format(active.cfs)} CFS`
                    : 'past 7 days'}
            </span>
            <span className='sr-only'>
                Past 7 days: {cfsFormat.format(min)}–{cfsFormat.format(max)} CFS
                {trend ? `, ${trend}` : ''}
            </span>
        </span>
    );
}
