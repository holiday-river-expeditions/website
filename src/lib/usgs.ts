import { z } from 'zod';

/**
 * Live river flow (CFS) from the USGS Instantaneous Values API — the
 * machine-readable source behind the gauges Holiday already links in
 * their pre-trip emails (via CBRFC flow graphs).
 *
 * A river doc's `usgsSiteId` may hold several comma-separated site
 * numbers whose latest discharges are SUMMED: Cataract Canyon sits below
 * the Green/Colorado confluence, so its flow is Colorado near Cisco plus
 * Green at Green River, UT.
 *
 * House convention: any failure — bad config, network, missing data —
 * returns null and the UI simply omits the flow chip.
 */

const SITE_IDS = /^\d{8,15}(,\d{8,15})*$/;

export interface RiverFlowReading {
    /** Combined discharge in cubic feet per second. */
    cfs: number;
    /** ISO timestamp of the oldest reading contributing to the sum. */
    asOf: string;
}

const usgsResponseSchema = z.object({
    value: z.object({
        timeSeries: z.array(
            z.object({
                values: z.array(
                    z.object({
                        value: z.array(
                            z.object({
                                value: z.string(),
                                dateTime: z.string(),
                            }),
                        ),
                    }),
                ),
            }),
        ),
    }),
});

/** Sums the latest reading of each series; null when nothing usable.
    Exported for tests. */
export function parseUsgsFlow(payload: unknown): RiverFlowReading | null {
    const parsed = usgsResponseSchema.safeParse(payload);
    if (!parsed.success) return null;

    let cfs = 0;
    let readings = 0;
    let asOf: string | null = null;
    for (const series of parsed.data.value.timeSeries) {
        const latest = series.values[0]?.value.at(-1);
        if (!latest) continue;
        const discharge = Number(latest.value);
        // USGS marks missing/ice-affected data with negative sentinels.
        if (!Number.isFinite(discharge) || discharge < 0) continue;
        cfs += discharge;
        readings += 1;
        if (asOf === null || latest.dateTime < asOf) asOf = latest.dateTime;
    }
    if (readings === 0 || asOf === null) return null;
    return { cfs: Math.round(cfs), asOf };
}

export async function getRiverFlow(
    siteIds: string | null | undefined,
): Promise<RiverFlowReading | null> {
    const sites = siteIds?.replace(/\s/g, '') ?? '';
    if (!SITE_IDS.test(sites)) return null;
    try {
        const res = await fetch(
            `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${sites}&parameterCd=00060&siteStatus=all`,
            // Flow changes slowly; refresh at most every 30 minutes.
            { next: { revalidate: 1800 } },
        );
        if (!res.ok) return null;
        return parseUsgsFlow(await res.json());
    } catch {
        return null;
    }
}

/** Where a flow reading links when the river has no authored flowLinkUrl:
    the first gauge's USGS monitoring page. */
export function usgsGaugeUrl(siteIds: string): string {
    const first = siteIds.replace(/\s/g, '').split(',')[0];
    return `https://waterdata.usgs.gov/monitoring-location/${first}/`;
}
