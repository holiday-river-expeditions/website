'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Header cart chip + popover. Renders nothing until a cart exists (count
 * read from the non-httpOnly hre_cart_count cookie, updated live via the
 * hre:cart-updated event from BookingRow). Contents come from /api/cart.
 */

interface CartItemView {
    id: number;
    summary: string;
    cost: number | null;
}

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

function readCountCookie(): number {
    const match = document.cookie.match(/(?:^|;\s*)hre_cart_count=(\d+)/);
    return match ? Number(match[1]) : 0;
}

/** Cookie-backed count store: BookingRow and this component dispatch
    hre:cart-updated after any response that rewrites the cart cookies. */
function subscribeCartCount(callback: () => void) {
    window.addEventListener('hre:cart-updated', callback);
    return () => window.removeEventListener('hre:cart-updated', callback);
}

function notifyCartUpdated() {
    window.dispatchEvent(new CustomEvent('hre:cart-updated'));
}

export function MiniCart() {
    const count = useSyncExternalStore(
        subscribeCartCount,
        readCountCookie,
        () => 0,
    );
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<CartItemView[] | null>(null);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        const onClick = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClick);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onClick);
        };
    }, [open]);

    async function toggle() {
        const next = !open;
        setOpen(next);
        if (next) {
            setError(false);
            try {
                const res = await fetch('/api/cart');
                if (!res.ok) throw new Error();
                const body = (await res.json()) as {
                    items: CartItemView[];
                    checkoutUrl: string | null;
                };
                setItems(body.items);
                setCheckoutUrl(body.checkoutUrl);
                notifyCartUpdated();
            } catch {
                setError(true);
            }
        }
    }

    async function remove(itemId: number) {
        try {
            const res = await fetch('/api/cart', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId }),
            });
            if (!res.ok) throw new Error();
            const body = (await res.json()) as {
                items: CartItemView[];
                checkoutUrl: string | null;
            };
            setItems(body.items);
            setCheckoutUrl(body.checkoutUrl);
            notifyCartUpdated();
            if (body.items.length === 0) setOpen(false);
        } catch {
            setError(true);
        }
    }

    if (count <= 0) return null;

    return (
        <div ref={rootRef} className='relative'>
            <button
                type='button'
                aria-expanded={open}
                aria-label={`Cart, ${count} ${count === 1 ? 'trip' : 'trips'}`}
                onClick={toggle}
                className='relative flex h-10 w-10 items-center justify-center text-holiday-red transition-opacity hover:opacity-70'
            >
                <svg
                    aria-hidden
                    width='22'
                    height='22'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <circle cx='9' cy='21' r='1.5' />
                    <circle cx='19' cy='21' r='1.5' />
                    <path d='M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6' />
                </svg>
                <span
                    aria-hidden
                    className='absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-holiday-red font-alt-gothic text-[11px] font-semibold leading-none text-holiday-white'
                >
                    {count}
                </span>
            </button>

            {open && (
                <div className='absolute right-0 top-12 z-50 w-80 border border-holiday-grey/40 bg-holiday-white p-4 shadow-lg'>
                    <h2 className='font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.05em] text-onyx'>
                        Your Cart
                    </h2>
                    {error ? (
                        <p className='mt-3 text-body leading-body text-onyx'>
                            Cart is momentarily unavailable — call{' '}
                            <a
                                href='tel:+18012662087'
                                className='font-bold text-holiday-red'
                            >
                                801-266-2087
                            </a>
                            .
                        </p>
                    ) : items === null ? (
                        <p className='mt-3 text-body text-onyx/70'>Loading…</p>
                    ) : (
                        <>
                            <ul className='mt-3 divide-y divide-holiday-grey/30'>
                                {items.map((item) => (
                                    <li
                                        key={item.id}
                                        className='flex items-start justify-between gap-3 py-2.5'
                                    >
                                        <div className='text-[14px] leading-snug text-onyx'>
                                            {item.summary}
                                            {item.cost !== null && (
                                                <div className='mt-0.5 font-alt-gothic text-[15px] font-semibold text-holiday-red'>
                                                    {currency.format(item.cost)}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type='button'
                                            aria-label={`Remove ${item.summary}`}
                                            onClick={() => remove(item.id)}
                                            className='shrink-0 p-1 text-[13px] uppercase tracking-wider text-onyx/70 underline transition-colors hover:text-holiday-red'
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {checkoutUrl && (
                                <a
                                    href={checkoutUrl}
                                    className='mt-3 block rounded-full bg-holiday-red px-6 py-2.5 text-center font-alt-gothic text-[17px] font-medium uppercase leading-none tracking-wide text-holiday-white transition-colors hover:bg-holiday-red/90'
                                >
                                    Continue to Secure Checkout
                                </a>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
