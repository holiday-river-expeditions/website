'use client';

/**
 * Accessible stepper group for choosing guests per pricing level
 * (Adult / Senior-Youth etc). Buttons adjust; the number input allows
 * direct entry. Totals are enforced by the caller.
 */

export interface PricingLevelOption {
    field: string;
    name: string;
    description: string | null;
    amount: number | null;
}

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

export function PartySizeSelector({
    levels,
    counts,
    maxTotal,
    onChange,
}: {
    levels: PricingLevelOption[];
    counts: Record<string, number>;
    maxTotal: number;
    onChange: (counts: Record<string, number>) => void;
}) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    function setCount(field: string, value: number) {
        const next = Math.max(0, Math.min(value, 30));
        onChange({ ...counts, [field]: next });
    }

    const stepButton =
        'flex h-9 w-9 items-center justify-center border-2 border-onyx/40 font-alt-gothic text-[18px] leading-none text-onyx transition-colors hover:border-onyx disabled:opacity-30 disabled:hover:border-onyx/40';

    return (
        <div className='space-y-3'>
            {levels.map((level) => {
                const count = counts[level.field] ?? 0;
                const atMax = total >= maxTotal;
                return (
                    <div
                        key={level.field}
                        className='flex flex-wrap items-center justify-between gap-x-6 gap-y-2'
                    >
                        <div>
                            <div className='font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.03em] text-onyx'>
                                {level.name}
                                {level.amount !== null && (
                                    <span className='ml-2 text-holiday-red'>
                                        {currency.format(level.amount)}
                                    </span>
                                )}
                            </div>
                            {level.description && (
                                <div className='text-[13px] leading-snug text-onyx/70'>
                                    {level.description}
                                </div>
                            )}
                        </div>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                aria-label={`Fewer ${level.name} guests`}
                                disabled={count <= 0}
                                onClick={() => setCount(level.field, count - 1)}
                                className={stepButton}
                            >
                                −
                            </button>
                            <input
                                type='number'
                                inputMode='numeric'
                                min={0}
                                max={30}
                                value={count}
                                aria-label={`${level.name} guests`}
                                onChange={(e) =>
                                    setCount(
                                        level.field,
                                        Number(e.target.value) || 0,
                                    )
                                }
                                className='h-9 w-14 border border-onyx/30 bg-holiday-white text-center text-body text-onyx'
                            />
                            <button
                                type='button'
                                aria-label={`More ${level.name} guests`}
                                disabled={atMax}
                                onClick={() => setCount(level.field, count + 1)}
                                className={stepButton}
                            >
                                +
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
