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
    /** River/destination label, rendered verbatim (Sanity river docs are
        named by section — "Cataract", "Westwater", "Maze" — so appending
        "River" would fabricate wrong names). Replaces the old difficulty
        chip per the Aug 20 decision. */
    river?: string;
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
    river,
}: TripCardProps) {
    // Category tag is a solid fill: teal for rafting, sand for biking (per mockup).
    // Sand fill needs dark text for WCAG AA contrast; teal carries white.
    const tagColor = /bik/i.test(category)
        ? 'bg-sand text-onyx'
        : 'bg-teal text-holiday-white';
    const riverLabel = river || null;

    return (
        <Link href={href} className='group block'>
            <div
                className={`relative aspect-[362/355] overflow-hidden ${
                    featured ? 'border-4 border-holiday-red' : ''
                }`}
            >
                <div
                    className='absolute inset-0 bg-cover bg-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105'
                    style={{ backgroundImage: `url(${image})` }}
                />
                {ribbon && (
                    <span className='absolute left-0 top-4 z-10 whitespace-nowrap bg-holiday-red px-3.5 py-1.5 text-[14px] font-bold leading-tight text-holiday-white'>
                        {ribbon}
                    </span>
                )}
            </div>
            <div className='mt-4 flex items-start justify-between gap-4'>
                <span className='flex flex-wrap gap-2'>
                    <span
                        className={`inline-block ${tagColor} px-3.5 py-1.5 text-[14px] font-bold leading-tight`}
                    >
                        {category}
                    </span>
                    {riverLabel && (
                        <span className='inline-block border border-onyx/40 px-3.5 py-1.5 text-[14px] font-bold leading-tight text-onyx'>
                            {riverLabel}
                        </span>
                    )}
                </span>
                <div className='text-right font-alt-gothic text-[16px] font-semibold uppercase leading-tight text-onyx/70'>
                    <div>Starts at {startingPrice}</div>
                    <div>{duration}</div>
                </div>
            </div>
            <h3 className='mt-3 font-alt-gothic text-section font-black uppercase text-holiday-red'>
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
