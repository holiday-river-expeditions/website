import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * The guest's Arctic cart handle, persisted as an httpOnly cookie plus a
 * client-readable count cookie for the header mini-cart chip. The sessid is
 * a hygiene secret, not a security boundary — Arctic itself embeds it in
 * checkout URLs.
 */

export const CART_COOKIE = 'hre_cart';
export const CART_COUNT_COOKIE = 'hre_cart_count';
const CART_TTL_SECONDS = 2 * 60 * 60;

const cartCookieSchema = z.object({
    cartid: z.number().int(),
    sessid: z.string(),
    checkout: z.string(),
    count: z.number().int().min(0),
});
export type CartCookie = z.infer<typeof cartCookieSchema>;

export async function readCartCookie(): Promise<CartCookie | null> {
    const store = await cookies();
    const raw = store.get(CART_COOKIE)?.value;
    if (!raw) return null;
    try {
        return cartCookieSchema.parse(JSON.parse(raw));
    } catch {
        return null;
    }
}

/** Writes (or clears, when null) both cart cookies on a response. */
export function withCartCookies(
    res: NextResponse,
    cart: CartCookie | null,
): NextResponse {
    if (cart) {
        res.cookies.set(CART_COOKIE, JSON.stringify(cart), {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: CART_TTL_SECONDS,
            path: '/',
        });
        res.cookies.set(CART_COUNT_COOKIE, String(cart.count), {
            secure: true,
            sameSite: 'lax',
            maxAge: CART_TTL_SECONDS,
            path: '/',
        });
    } else {
        res.cookies.delete(CART_COOKIE);
        res.cookies.delete(CART_COUNT_COOKIE);
    }
    return res;
}
