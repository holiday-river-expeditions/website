'use client';

import { useEffect, useRef, useState } from 'react';
import {
    PartySizeSelector,
    type PricingLevelOption,
} from '@/components/ui/PartySizeSelector';

/**
 * Inline booking flow for one departure row. Progressive enhancement over
 * the external booking link: the row expands in place (context stays
 * visible — no modal), walks select → added → checkout handoff, and falls
 * back to the external link whenever pricing or the cart API is
 * unavailable.
 *
 * States: collapsed → selecting → submitting → added | error(409/503)
 */

type FlowState =
    | { step: 'collapsed' }
    | { step: 'loading-pricing' }
    | { step: 'selecting'; levels: PricingLevelOption[] }
    | { step: 'submitting'; levels: PricingLevelOption[] }
    | {
          step: 'added';
          checkoutUrl: string;
          itemSummary: string | null;
          cost: number | null;
      }
    | { step: 'error'; message: string; recoverable: boolean };

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export function BookingRow({
    departureId,
    triptypeid,
    seatsRemaining,
    fallbackUrl,
    dateLabel,
    dateSlot,
    badgeSlot,
}: {
    departureId: number;
    triptypeid: number;
    seatsRemaining: number;
    fallbackUrl: string;
    dateLabel: string;
    /** Server-rendered date cell (keeps the row's server markup intact). */
    dateSlot: React.ReactNode;
    /** Server-rendered seats badge. */
    badgeSlot: React.ReactNode;
}) {
    const [flow, setFlow] = useState<FlowState>({ step: 'collapsed' });
    const [counts, setCounts] = useState<Record<string, number>>({});
    const panelRef = useRef<HTMLDivElement>(null);

    const expanded = flow.step !== 'collapsed';

    useEffect(() => {
        if (flow.step === 'selecting') panelRef.current?.focus();
    }, [flow.step]);

    async function expand() {
        setFlow({ step: 'loading-pricing' });
        try {
            const res = await fetch(`/api/book/pricing/${triptypeid}`);
            if (!res.ok) throw new Error('pricing unavailable');
            const body = (await res.json()) as {
                levels: PricingLevelOption[];
            };
            if (!body.levels?.length) throw new Error('no levels');
            const initial: Record<string, number> = {};
            for (const level of body.levels) initial[level.field] = 0;
            // Sensible default: 2 guests on the first (usually Adult) level.
            initial[body.levels[0].field] = Math.min(2, seatsRemaining);
            setCounts(initial);
            setFlow({ step: 'selecting', levels: body.levels });
        } catch {
            // Pricing not resolvable — hand off to the external flow.
            window.location.href = fallbackUrl;
        }
    }

    async function addToCart(levels: PricingLevelOption[]) {
        setFlow({ step: 'submitting', levels });
        try {
            const res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ departureId, counts }),
            });
            const body = (await res.json()) as {
                ok?: boolean;
                checkoutUrl?: string;
                itemSummary?: string | null;
                cost?: number | null;
                cartCount?: number;
                error?: string;
            };
            if (!res.ok || !body.ok || !body.checkoutUrl) {
                setFlow({
                    step: 'error',
                    message:
                        body.error ??
                        'Something went wrong. Call 801-266-2087 to book.',
                    recoverable: res.status === 409,
                });
                return;
            }
            if (typeof body.cartCount === 'number') {
                window.dispatchEvent(
                    new CustomEvent('hre:cart-updated', {
                        detail: { count: body.cartCount },
                    }),
                );
            }
            setFlow({
                step: 'added',
                checkoutUrl: body.checkoutUrl,
                itemSummary: body.itemSummary ?? null,
                cost: body.cost ?? null,
            });
        } catch {
            setFlow({
                step: 'error',
                message:
                    'Online booking is momentarily unavailable. Call 801-266-2087 to grab your seat.',
                recoverable: false,
            });
        }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const estimate =
        flow.step === 'selecting' || flow.step === 'submitting'
            ? flow.levels.reduce(
                  (sum, level) =>
                      sum + (level.amount ?? 0) * (counts[level.field] ?? 0),
                  0,
              )
            : 0;

    const primaryButton =
        'rounded-full bg-holiday-red px-6 py-2 text-center font-alt-gothic text-[19px] font-medium uppercase leading-none tracking-wide text-holiday-white transition-colors hover:bg-holiday-red/90 disabled:opacity-40 disabled:hover:bg-holiday-red';
    const outlineButton =
        'rounded-full border-2 border-holiday-red px-6 py-2 text-center font-alt-gothic text-[19px] font-medium uppercase leading-none tracking-wide text-holiday-red transition-colors hover:bg-holiday-red hover:text-holiday-white';

    return (
        <>
            {dateSlot}
            <div className='flex flex-wrap items-center gap-4 justify-self-start sm:justify-self-end'>
                {badgeSlot}
                <button
                    type='button'
                    aria-expanded={expanded}
                    onClick={() =>
                        expanded ? setFlow({ step: 'collapsed' }) : expand()
                    }
                    className={primaryButton}
                >
                    Book
                </button>
            </div>
            {expanded && <div className='sm:col-span-2'>{renderPanel()}</div>}
        </>
    );

    function renderPanel() {
        return (
            <div>
                {flow.step === 'loading-pricing' && (
                    // Skeleton mirroring the selector's final layout — the
                    // NN/g-preferred shape for short waits: reserves the
                    // space (no layout shift) and previews the structure.
                    <div
                        aria-live='polite'
                        aria-label='Loading rates'
                        className='mt-3 border-l-2 border-holiday-red bg-holiday-grey/10 p-4 sm:p-5'
                    >
                        <span className='sr-only'>Loading rates…</span>
                        {[0, 1].map((row) => (
                            <div
                                key={row}
                                aria-hidden
                                className='flex items-center justify-between gap-6 py-3'
                            >
                                <div className='space-y-2'>
                                    <div className='h-4 w-36 bg-holiday-grey/40 motion-safe:animate-pulse' />
                                    <div className='h-3 w-24 bg-holiday-grey/25 motion-safe:animate-pulse' />
                                </div>
                                <div className='flex items-center gap-2'>
                                    <div className='h-9 w-9 bg-holiday-grey/25 motion-safe:animate-pulse' />
                                    <div className='h-9 w-14 bg-holiday-grey/40 motion-safe:animate-pulse' />
                                    <div className='h-9 w-9 bg-holiday-grey/25 motion-safe:animate-pulse' />
                                </div>
                            </div>
                        ))}
                        <div className='mt-3 flex items-center justify-end gap-3 border-t border-holiday-grey/40 pt-4'>
                            <div className='h-9 w-28 rounded-full bg-holiday-grey/25 motion-safe:animate-pulse' />
                            <div className='h-9 w-36 rounded-full bg-holiday-grey/40 motion-safe:animate-pulse' />
                        </div>
                    </div>
                )}

                {(flow.step === 'selecting' || flow.step === 'submitting') && (
                    <div
                        ref={panelRef}
                        tabIndex={-1}
                        aria-label={`Book ${dateLabel}`}
                        className='mt-3 border-l-2 border-holiday-red bg-holiday-grey/10 p-4 sm:p-5'
                    >
                        <PartySizeSelector
                            levels={flow.levels}
                            counts={counts}
                            maxTotal={seatsRemaining}
                            onChange={setCounts}
                        />
                        <div className='mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-holiday-grey/40 pt-4'>
                            <div className='font-alt-gothic text-[17px] font-semibold uppercase text-onyx'>
                                {total} {total === 1 ? 'guest' : 'guests'}
                                {estimate > 0 && (
                                    <span className='ml-3 text-holiday-red'>
                                        ~{currency.format(estimate)}
                                    </span>
                                )}
                                <span className='ml-2 text-[12px] font-normal normal-case tracking-normal text-onyx/70'>
                                    + fees, finalized at checkout
                                </span>
                            </div>
                            <div className='flex gap-3'>
                                <button
                                    type='button'
                                    onClick={() =>
                                        setFlow({ step: 'collapsed' })
                                    }
                                    className={outlineButton}
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    disabled={
                                        total < 1 || flow.step === 'submitting'
                                    }
                                    onClick={() => addToCart(flow.levels)}
                                    className={primaryButton}
                                >
                                    {flow.step === 'submitting'
                                        ? 'Adding…'
                                        : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {flow.step === 'added' && (
                    <div
                        aria-live='polite'
                        className='mt-3 border-l-2 border-teal bg-holiday-grey/10 p-4 sm:p-5'
                    >
                        <p className='font-alt-gothic text-[19px] font-semibold uppercase text-onyx'>
                            Added to your cart
                        </p>
                        {flow.itemSummary && (
                            <p className='mt-1 text-body leading-body text-onyx/80'>
                                {flow.itemSummary}
                                {flow.cost !== null &&
                                    ` · ${currency.format(flow.cost)} incl. fees`}
                            </p>
                        )}
                        <p className='mt-3 text-body leading-body text-onyx'>
                            Next you&rsquo;ll enter guest details and payment on
                            our secure reservation system (Arctic Reservations).
                        </p>
                        <div className='mt-4 flex flex-wrap gap-3'>
                            <a
                                href={flow.checkoutUrl}
                                className={primaryButton}
                            >
                                Continue to Secure Checkout
                            </a>
                            <button
                                type='button'
                                onClick={() => setFlow({ step: 'collapsed' })}
                                className={outlineButton}
                            >
                                Keep Browsing Dates
                            </button>
                        </div>
                    </div>
                )}

                {flow.step === 'error' && (
                    <div
                        role='alert'
                        className='mt-3 border-l-2 border-holiday-red bg-holiday-grey/10 p-4 sm:p-5'
                    >
                        <p className='text-body leading-body text-onyx'>
                            {flow.message}
                        </p>
                        <div className='mt-3 flex flex-wrap gap-3'>
                            {flow.recoverable && (
                                <button
                                    type='button'
                                    onClick={expand}
                                    className={outlineButton}
                                >
                                    Try Different Party Size
                                </button>
                            )}
                            <a
                                href='tel:+18012662087'
                                className={outlineButton}
                            >
                                Call 801-266-2087
                            </a>
                            <button
                                type='button'
                                onClick={() => setFlow({ step: 'collapsed' })}
                                className={outlineButton}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
