import Link from 'next/link';

export interface TripCardProps {
    name: string;
    category: string;
    image: string;
    startingPrice: string;
    duration: string;
    description: string;
    href: string;
}

export function TripCard({
    name,
    category,
    image,
    startingPrice,
    duration,
    description,
    href,
}: TripCardProps) {
    return (
        <Link href={href} className='group block'>
            <div className='relative aspect-[4/3] overflow-hidden'>
                <div
                    className='absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105'
                    style={{ backgroundImage: `url(${image})` }}
                />
            </div>
            <div className='mt-4 flex items-start justify-between gap-4'>
                <span className='inline-block rounded-full border border-holiday-red px-3 py-1 font-alt-gothic text-[10px] font-medium uppercase tracking-widest text-holiday-red'>
                    {category}
                </span>
                <div className='text-right font-alt-gothic text-[10px] uppercase tracking-widest text-holiday-grey'>
                    <div>Starts at {startingPrice}</div>
                    <div>{duration}</div>
                </div>
            </div>
            <h3 className='mt-3 font-alt-gothic text-h3 font-medium uppercase leading-h3 text-holiday-red md:text-[32px]'>
                {name}
            </h3>
            <p className='mt-2 text-body leading-body text-onyx'>
                {description}
            </p>
        </Link>
    );
}
