type SectionBackground = 'white' | 'off-white' | 'charcoal' | 'canyon' | 'sand';

interface SectionProps {
    background?: SectionBackground;
    className?: string;
    children: React.ReactNode;
    fullBleed?: boolean;
}

const bgStyles: Record<SectionBackground, string> = {
    white: 'bg-white',
    'off-white': 'bg-off-white',
    charcoal: 'bg-charcoal text-white',
    canyon: 'bg-canyon text-white',
    sand: 'bg-sand',
};

export function Section({
    background = 'white',
    className = '',
    children,
    fullBleed = false,
}: SectionProps) {
    return (
        <section className={`px-6 py-16 ${bgStyles[background]} ${className}`}>
            {fullBleed ? (
                children
            ) : (
                <div className='mx-auto max-w-7xl'>{children}</div>
            )}
        </section>
    );
}
