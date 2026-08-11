import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCartItems, removeCartItem } from '@/lib/arctic';
import { readCartCookie, withCartCookies } from '@/lib/cart-cookie';

/** Mini-cart backend: list and remove items in the guest's Arctic cart. */

export async function GET() {
    const cart = await readCartCookie();
    if (!cart) return NextResponse.json({ items: [], checkoutUrl: null });

    try {
        const contents = await getCartItems({
            cartid: cart.cartid,
            sessid: cart.sessid,
        });
        const items = contents.cart?.items ?? [];
        // Reconcile the count cookie with reality (items can expire).
        const res = NextResponse.json({
            items: items.map((item) => ({
                id: item.id,
                summary: item.description ?? item.name ?? 'Reservation',
                cost: item.cost ?? null,
            })),
            checkoutUrl: items.length > 0 ? cart.checkout : null,
        });
        return withCartCookies(
            res,
            items.length > 0 ? { ...cart, count: items.length } : null,
        );
    } catch (error) {
        console.error('[api/cart] GET failed:', error);
        return NextResponse.json(
            { error: 'Cart is momentarily unavailable.' },
            { status: 503 },
        );
    }
}

const removeSchema = z.object({ itemId: z.number().int().positive() });

export async function DELETE(req: Request) {
    const cart = await readCartCookie();
    if (!cart) return NextResponse.json({ items: [], checkoutUrl: null });

    let json: unknown;
    try {
        json = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const parsed = removeSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
    }

    try {
        const handle = { cartid: cart.cartid, sessid: cart.sessid };
        await removeCartItem(handle, parsed.data.itemId);
        const contents = await getCartItems(handle);
        const items = contents.cart?.items ?? [];
        const res = NextResponse.json({
            items: items.map((item) => ({
                id: item.id,
                summary: item.description ?? item.name ?? 'Reservation',
                cost: item.cost ?? null,
            })),
            checkoutUrl: items.length > 0 ? cart.checkout : null,
        });
        return withCartCookies(
            res,
            items.length > 0 ? { ...cart, count: items.length } : null,
        );
    } catch (error) {
        console.error('[api/cart] DELETE failed:', error);
        return NextResponse.json(
            { error: 'Cart is momentarily unavailable.' },
            { status: 503 },
        );
    }
}
