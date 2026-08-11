import { NextResponse } from 'next/server';
import { getTripPricingLevels, pricingLevelField } from '@/lib/arctic';

/**
 * Pricing levels for the booking widget (server-cached 10 min in
 * booking.ts). Exposes only display fields plus the cart form field name —
 * Arctic credentials stay server-side.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ triptypeid: string }> },
) {
    const { triptypeid } = await params;
    const id = Number(triptypeid);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json(
            { error: 'Invalid trip type' },
            { status: 400 },
        );
    }

    const levels = await getTripPricingLevels(id);
    if (!levels) {
        return NextResponse.json(
            { error: 'Pricing unavailable' },
            { status: 503 },
        );
    }

    return NextResponse.json({
        levels: levels.map((level) => ({
            field: pricingLevelField(level),
            name: level.name,
            description: level.description ?? null,
            amount: level.amount ?? null,
        })),
    });
}
