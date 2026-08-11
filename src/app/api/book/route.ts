import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BookingError, createCartItem, getDeparture } from '@/lib/arctic';
import {
    type CartCookie,
    readCartCookie,
    withCartCookies,
} from '@/lib/cart-cookie';

/**
 * Native booking: adds a departure to the guest's Arctic cart via the
 * Public Cart API (server-side; credentials and guest-site traffic never
 * touch the browser).
 *
 * Carted seats do NOT hold inventory (verified live), so the availability
 * re-check here is friendly early messaging — Arctic enforces at checkout.
 */

/** Arctic writes summaries lowercase ("reservation for…"); present them
 *  sentence-cased. */
function sentenceCase(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

const bookRequestSchema = z.object({
    departureId: z.number().int().positive(),
    counts: z
        .record(
            z.string().regex(/^pl_[a-z0-9_]+$/),
            z.number().int().min(0).max(30),
        )
        .refine(
            (counts) => {
                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                return total >= 1 && total <= 30;
            },
            { message: 'Party size must be between 1 and 30.' },
        ),
});

export async function POST(req: Request) {
    let json: unknown;
    try {
        json = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = bookRequestSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Please pick at least one guest.' },
            { status: 400 },
        );
    }
    const { departureId, counts } = parsed.data;
    const partySize = Object.values(counts).reduce((a, b) => a + b, 0);

    // Friendly early sold-out/canceled check (Arctic enforces at checkout).
    const departure = await getDeparture(departureId);
    if (departure) {
        if (departure.canceled) {
            return NextResponse.json(
                { error: 'This departure is no longer running.' },
                { status: 409 },
            );
        }
        const remaining = departure.remainingopenings;
        if (
            remaining !== null &&
            remaining !== undefined &&
            remaining < partySize
        ) {
            return NextResponse.json(
                {
                    error:
                        remaining <= 0
                            ? 'This date just filled up — call 801-266-2087 and we may be able to help.'
                            : `Only ${remaining} ${remaining === 1 ? 'seat' : 'seats'} left on this date.`,
                },
                { status: 409 },
            );
        }
    }

    const existing = await readCartCookie();
    try {
        const created = await createCartItem(
            departureId,
            counts,
            existing
                ? { cartid: existing.cartid, sessid: existing.sessid }
                : undefined,
        );
        const cart: CartCookie = {
            cartid: created.cart.id,
            sessid: created.cart.sessid,
            checkout: created.checkoutUrl,
            count: (existing?.count ?? 0) + 1,
        };
        const res = NextResponse.json({
            ok: true,
            checkoutUrl: created.checkoutUrl,
            itemSummary: created.itemSummary
                ? sentenceCase(created.itemSummary)
                : null,
            cost: created.cost,
            cartCount: cart.count,
        });
        return withCartCookies(res, cart);
    } catch (error) {
        if (error instanceof BookingError && error.kind === 'rejected') {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error('[api/book] failed:', error);
        return NextResponse.json(
            {
                error: 'Online booking is momentarily unavailable — call 801-266-2087 to grab your seat.',
            },
            { status: 503 },
        );
    }
}
