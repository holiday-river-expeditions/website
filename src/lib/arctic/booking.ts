import { arcticGet } from './client';
import { isArcticConfigured } from './config';
import {
    type ArcticCart,
    type ArcticCartContents,
    type ArcticPricingLevel,
    bookResponseSchema,
    cartContentsSchema,
    listEnvelope,
    pricingLevelSchema,
} from './types';

/**
 * Server-only cart operations against Arctic's Public Cart API (guest site).
 * All behavior verified live 2026-08-10 — see docs/project/arctic-api.md,
 * "Verified Cart API Behavior". Key facts:
 *  - book: POST {guest}/reserve/api/book/{departureId}, form-encoded
 *    `pl_<slugified uniquename>=count` fields
 *  - response carries {cart: {id, sessid}, checkout, interstitial}
 *  - carted seats do NOT hold inventory; Arctic enforces at checkout
 */

const GUEST_SITE_FALLBACK = 'https://holidayriver-guest-site-1.arcticres.com';
const REQUEST_TIMEOUT_MS = 10_000;
const PRICING_CACHE_TTL_MS = 10 * 60_000;

export class BookingError extends Error {
    constructor(
        message: string,
        readonly kind: 'unavailable' | 'rejected',
    ) {
        super(message);
        this.name = 'BookingError';
    }
}

/**
 * The guest-site origin hosting the public cart API. Discovered from the
 * bikeraft.com embed; override with ARCTIC_GUEST_SITE_URL when the
 * installation's guest site moves (e.g. domain cutover).
 */
export function getGuestSiteBase(): string {
    return (
        process.env.ARCTIC_GUEST_SITE_URL?.replace(/\/$/, '') ??
        GUEST_SITE_FALLBACK
    );
}

/** Cart form field name for a pricing level: pl_ + slugified uniquename. */
export function pricingLevelField(
    level: Pick<ArcticPricingLevel, 'uniquename'>,
): string {
    return `pl_${level.uniquename
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')}`;
}

interface CachedPricing {
    levels: ArcticPricingLevel[];
    expiresAt: number;
}
const pricingCache = new Map<number, CachedPricing>();

/**
 * Public (showonline, non-deleted) pricing levels for a trip type, cached
 * for 10 minutes. Returns null when Arctic is unconfigured/unreachable or
 * the type has no online-bookable levels — callers fall back to the
 * external booking link for that row.
 */
export async function getTripPricingLevels(
    triptypeid: number,
): Promise<ArcticPricingLevel[] | null> {
    if (!isArcticConfigured()) return null;
    const cached = pricingCache.get(triptypeid);
    if (cached && cached.expiresAt > Date.now()) return cached.levels;

    try {
        const res = await arcticGet(
            `triptype/${triptypeid}/pricinglevel`,
            listEnvelope(pricingLevelSchema),
        );
        const levels = res.entries.filter(
            (level) => level.showonline && !level.deleted,
        );
        if (levels.length === 0) return null;
        pricingCache.set(triptypeid, {
            levels,
            expiresAt: Date.now() + PRICING_CACHE_TTL_MS,
        });
        return levels;
    } catch (error) {
        console.error(
            `[arctic] getTripPricingLevels(${triptypeid}) failed:`,
            error,
        );
        return null;
    }
}

async function guestFetch(path: string, init?: RequestInit): Promise<unknown> {
    const res = await fetch(`${getGuestSiteBase()}${path}`, {
        ...init,
        headers: { Accept: 'application/json', ...init?.headers },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: 'no-store',
    });
    try {
        return await res.json();
    } catch {
        throw new BookingError(
            `Arctic guest site returned non-JSON (HTTP ${res.status})`,
            'unavailable',
        );
    }
}

export interface CartHandle {
    cartid: number;
    sessid: string;
}

export interface CreatedCartItem {
    cart: ArcticCart;
    itemId: number;
    itemSummary: string | null;
    cost: number | null;
    checkoutUrl: string;
    interstitialUrl: string | null;
}

/**
 * Adds a departure to a cart (creating one when no handle is passed).
 * `counts` maps pricing-level form fields (pl_*) to guest counts.
 */
export async function createCartItem(
    departureId: number,
    counts: Record<string, number>,
    existingCart?: CartHandle,
): Promise<CreatedCartItem> {
    const body = new URLSearchParams();
    for (const [field, count] of Object.entries(counts)) {
        if (count > 0) body.set(field, String(count));
    }
    if (existingCart) {
        body.set('cartid', String(existingCart.cartid));
        body.set('sessid', existingCart.sessid);
    }

    const json = await guestFetch(`/reserve/api/book/${departureId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });

    const parsed = bookResponseSchema.parse(json);
    if (!parsed.success) {
        throw new BookingError(
            parsed.details ?? parsed.error ?? 'Arctic rejected the booking',
            'rejected',
        );
    }
    return {
        cart: parsed.cart,
        itemId: parsed.item.id,
        itemSummary: parsed.item.description ?? parsed.item.name ?? null,
        cost: parsed.item.cost ?? null,
        checkoutUrl: parsed.checkout,
        interstitialUrl: parsed.interstitial ?? null,
    };
}

export async function getCartItems(
    cart: CartHandle,
): Promise<ArcticCartContents> {
    const json = await guestFetch(
        `/cart/api/item?cartid=${cart.cartid}&sessid=${encodeURIComponent(cart.sessid)}`,
    );
    return cartContentsSchema.parse(json);
}

export async function removeCartItem(
    cart: CartHandle,
    itemId: number,
): Promise<void> {
    await guestFetch(
        `/cart/api/item/${itemId}?cartid=${cart.cartid}&sessid=${encodeURIComponent(cart.sessid)}`,
        { method: 'DELETE' },
    );
}

/** Checkout URL for an existing cart (Arctic keys checkout off sessid). */
export function checkoutUrl(cart: CartHandle): string {
    return `${getGuestSiteBase()}/cart/checkout?sessid=${encodeURIComponent(cart.sessid)}`;
}
