type SectionBackground = 'white' | 'off-white' | 'charcoal';

interface SectionProps {
    background?: SectionBackground;
    className?: string;
    children: React.ReactNode;
}

const bgStyles: Record<SectionBackground, string> = {
    white: 'bg-white',
    'off-white': 'bg-off-white',
    charcoal: 'bg-charcoal text-white',
};

export function Section({
    background = 'white',
    className = '',
    children,
}: SectionProps) {
    return (
        <section className={`px-6 py-16 ${bgStyles[background]} ${className}`}>
            <div className="mx-auto max-w-7xl">{children}</div>
        </section>
    );
}
