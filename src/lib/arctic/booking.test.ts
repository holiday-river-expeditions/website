import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/**
 * Cart-operation tests against a mocked fetch (no Arctic sandbox exists).
 * Response shapes mirror the live probe of 2026-08-10 exactly.
 */

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const ENV_KEYS = [
    'ARCTIC_API_BASE_URL',
    'ARCTIC_CLIENT_ID',
    'ARCTIC_CLIENT_SECRET',
    'ARCTIC_USERNAME',
    'ARCTIC_PASSWORD',
    'ARCTIC_GUEST_SITE_URL',
] as const;

beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    process.env.ARCTIC_GUEST_SITE_URL = 'https://guest.example.com';
});

afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
});

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status });
}

test('pricingLevelField slugifies uniquename exactly like Arctic', async () => {
    const { pricingLevelField } = await import('./booking');
    expect(pricingLevelField({ uniquename: 'DS5day Regular Rate' })).toBe(
        'pl_ds5day_regular_rate',
    );
    expect(
        pricingLevelField({ uniquename: 'DS5day Group/Youth/Senior Rate' }),
    ).toBe('pl_ds5day_group_youth_senior_rate');
});

test('createCartItem posts pl_* fields and parses the live response shape', async () => {
    fetchMock.mockResolvedValueOnce(
        jsonResponse({
            success: true,
            cart: {
                id: 4058,
                sessid: 'abc123',
                createdon: '2026-08-10 22:00:03',
                lastactivity: '2026-08-10 22:00:03',
            },
            item: {
                id: 4901,
                name: 'Reservation A7062',
                description: 'reservation for White Rim Trail…',
                image: null,
                summary: '<strong>…</strong>',
                is_available: true,
                is_ready: {},
                quantity: 1,
                cost: 1449.31,
            },
            checkout: 'https://guest.example.com/cart/checkout?sessid=abc123',
            interstitial:
                'https://guest.example.com/reserve/A4901/interstitial?sessid=abc123',
        }),
    );

    const { createCartItem } = await import('./booking');
    const created = await createCartItem(1241, {
        pl_adult: 2,
        pl_youth: 0,
    });

    expect(created.cart).toEqual({ id: 4058, sessid: 'abc123' });
    expect(created.itemId).toBe(4901);
    expect(created.cost).toBe(1449.31);
    expect(created.checkoutUrl).toContain('/cart/checkout');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe('https://guest.example.com/reserve/api/book/1241');
    const body = String(init.body);
    expect(body).toContain('pl_adult=2');
    // Zero counts are omitted — Arctic rejects empty counts, not zeros.
    expect(body).not.toContain('pl_youth');
});

test('createCartItem appends to an existing cart via cartid+sessid', async () => {
    fetchMock.mockResolvedValueOnce(
        jsonResponse({
            success: true,
            cart: { id: 7, sessid: 's7' },
            item: { id: 1, quantity: 1, cost: 100 },
            checkout: 'https://guest.example.com/cart/checkout?sessid=s7',
        }),
    );
    const { createCartItem } = await import('./booking');
    await createCartItem(99, { pl_adult: 1 }, { cartid: 7, sessid: 's7' });
    const body = String((fetchMock.mock.calls[0][1] as RequestInit).body);
    expect(body).toContain('cartid=7');
    expect(body).toContain('sessid=s7');
});

test('createCartItem surfaces Arctic rejections as BookingError', async () => {
    fetchMock.mockResolvedValueOnce(
        jsonResponse({
            success: false,
            error: 'add_failed',
            details: 'Please provide the guest and/or add-on counts.',
        }),
    );
    const { createCartItem, BookingError } = await import('./booking');
    await expect(createCartItem(1241, { pl_adult: 1 })).rejects.toThrow(
        BookingError,
    );
});

test('getGuestSiteBase prefers the env override', async () => {
    const { getGuestSiteBase } = await import('./booking');
    expect(getGuestSiteBase()).toBe('https://guest.example.com');
    delete process.env.ARCTIC_GUEST_SITE_URL;
    vi.resetModules();
    const fresh = await import('./booking');
    expect(fresh.getGuestSiteBase()).toBe(
        'https://holidayriver-guest-site-1.arcticres.com',
    );
});
