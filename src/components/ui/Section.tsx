type SectionBackground = 'white' | 'sand' | 'opal' | 'evergreen' | 'onyx';

interface SectionProps {
    background?: SectionBackground;
    className?: string;
    children: React.ReactNode;
    fullBleed?: boolean;
}

const bgStyles: Record<SectionBackground, string> = {
    white: 'bg-holiday-white text-onyx',
    sand: 'bg-sand text-onyx',
    opal: 'bg-opal text-onyx',
    evergreen: 'bg-evergreen text-holiday-white',
    onyx: 'bg-onyx text-holiday-white',
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
