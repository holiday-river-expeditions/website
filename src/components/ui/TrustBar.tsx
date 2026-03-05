interface TrustItem {
    label: string;
}

interface TrustBarProps {
    items: TrustItem[];
}

export function TrustBar({ items }: TrustBarProps) {
    return (
        <section className='border-b border-teal/20 bg-off-white px-6 py-4'>
            <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center'>
                {items.map((item, i) => (
                    <span key={item.label} className='flex items-center gap-3'>
                        <span className='text-link font-semibold uppercase tracking-widest text-taupe'>
                            {item.label}
                        </span>
                        {i < items.length - 1 && (
                            <span className='text-teal' aria-hidden='true'>
                                &middot;
                            </span>
                        )}
                    </span>
                ))}
            </div>
        </section>
    );
}
