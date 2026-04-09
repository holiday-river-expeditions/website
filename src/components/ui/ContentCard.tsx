import Link from 'next/link';

export interface ContentCardProps {
    title: string;
    image: string;
    href: string;
    isVideo?: boolean;
}

export function ContentCard({
    title,
    image,
    href,
    isVideo = false,
}: ContentCardProps) {
    return (
        <Link
            href={href}
            className='group relative block aspect-[3/4] overflow-hidden'
        >
            <div
                className='absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105'
                style={{ backgroundImage: `url(${image})` }}
            />
            <div className='absolute inset-0 bg-gradient-to-t from-onyx/80 via-onyx/10 to-transparent' />

            {isVideo && (
                <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='flex h-16 w-16 items-center justify-center rounded-full bg-holiday-white/90 shadow-lg'>
                        <svg
                            width='22'
                            height='22'
                            viewBox='0 0 24 24'
                            fill='currentColor'
                            className='ml-1 text-holiday-red'
                        >
                            <path d='M8 5v14l11-7z' />
                        </svg>
                    </span>
                </div>
            )}

            <h3 className='absolute bottom-5 left-5 right-5 font-alt-gothic text-h3 font-medium uppercase leading-h3 text-holiday-white drop-shadow-lg'>
                {title}
            </h3>
        </Link>
    );
}
