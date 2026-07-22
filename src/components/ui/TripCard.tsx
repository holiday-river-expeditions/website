import Link from 'next/link';

export interface TripCardProps {
    name: string;
    category: string;
    image: string;
    startingPrice: string;
    duration: string;
    /** Body copy. Omitted on specialty cards, which lead with a subtitle. */
    description?: string;
    href: string;
    /** Optional second line shown in red beneath the trip name. */
    subtitle?: string;
    /** Optional red ribbon label overlaid at the top-left of the image. */
    ribbon?: string;
    /** When true, frames the image in a red border (specialty/featured trips). */
    featured?: boolean;
}

export function TripCard({
    name,
    category,
    image,
    startingPrice,
    duration,
    description,
    href,
    subtitle,
    ribbon,
    featured = false,
}: TripCardProps) {
    // Category tag is a solid fill: teal for rafting, sand for biking (per mockup).
    const tagColor = /bik/i.test(category) ? 'bg-sand' : 'bg-teal';

    return (
        <Link href={href} className='group block'>
            <div
                className={`relative aspect-[362/355] overflow-hidden ${
                    featured ? 'border-4 border-holiday-red' : ''
                }`}
            >
                <div
                    className='absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105'
                    style={{ backgroundImage: `url(${image})` }}
                />
                {ribbon && (
                    <span className='absolute left-0 top-4 z-10 whitespace-nowrap bg-holiday-red px-3 py-1 font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-holiday-white'>
                        {ribbon}
                    </span>
                )}
            </div>
            <div className='mt-4 flex items-start justify-between gap-4'>
                <span
                    className={`inline-block ${tagColor} px-3 py-1 font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-holiday-white`}
                >
                    {category}
                </span>
                <div className='text-right font-alt-gothic text-[16px] font-semibold uppercase leading-tight text-holiday-grey'>
                    <div>Starts at {startingPrice}</div>
                    <div>{duration}</div>
                </div>
            </div>
            <h3 className='mt-3 font-alt-gothic text-[36px] font-black uppercase leading-[0.9] text-holiday-red'>
                {name}
            </h3>
            {subtitle && (
                <p className='mt-1 font-alt-gothic text-subheading font-black uppercase leading-[0.95] text-holiday-red'>
                    {subtitle}
                </p>
            )}
            {description && (
                <p className='mt-2 text-[14px] leading-[1.1] text-onyx'>
                    {description}
                </p>
            )}
        </Link>
    );
}
