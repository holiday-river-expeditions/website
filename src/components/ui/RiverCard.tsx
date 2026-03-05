import Link from 'next/link';

interface RiverCardProps {
    name: string;
    tagline: string;
    href: string;
    backgroundImage: string;
}

export function RiverCard({
    name,
    tagline,
    href,
    backgroundImage,
}: RiverCardProps) {
    return (
        <Link
            href={href}
            className='group relative block aspect-3/4 overflow-hidden rounded-lg border-t-4 border-teal'
        >
            {/* Background */}
            <div
                className='absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105'
                style={{ backgroundImage: `url(${backgroundImage})` }}
            />

            {/* Gradient overlay */}
            <div className='absolute inset-0 bg-gradient-to-t from-canyon/80 via-canyon/20 to-transparent' />

            {/* Content */}
            <div className='absolute inset-x-0 bottom-0 p-5'>
                <h3 className='text-h3 font-extrabold leading-h3 text-white'>
                    {name}
                </h3>
                <p className='mt-1 text-body leading-body text-white/80'>
                    {tagline}
                </p>
            </div>
        </Link>
    );
}
