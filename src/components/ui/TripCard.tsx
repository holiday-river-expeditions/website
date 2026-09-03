import Link from 'next/link';
import { imageUrl } from '@/lib/sanity';

/** Card tag fills, one per trip type. Sand needs dark text for WCAG AA
    contrast; the rest carry white. */
export type TripTagColor = 'teal' | 'sand' | 'evergreen' | 'red';

const TAG_CLASSES: Record<TripTagColor, string> = {
    teal: 'bg-teal text-holiday-white',
    sand: 'bg-sand text-onyx',
    evergreen: 'bg-evergreen text-holiday-white',
    red: 'bg-holiday-red text-holiday-white',
};

export interface TripCardProps {
    name: string;
    category: string;
    /** Fill for the category tag, from the trip type. */
    categoryColor?: TripTagColor;
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
    /** River label, rendered verbatim. Section documents are named by stretch
        ("Cataract", "Westwater", "Maze"), so the query resolves the river name
        first and falls back to the section. Replaces the old difficulty chip
        per the Aug 20 decision. */
    river?: string;
}

/** The shared TRIP_CARD projection in lib/sanity/queries.ts. Every grid on
    the site fetches this shape, so every grid maps it the same way. */
export interface TripCardSource {
    name?: string | null;
    slug?: { current?: string | null } | null;
    tagline?: string | null;
    subtitle?: string | null;
    ribbon?: string | null;
    startingPrice?: string | null;
    durationLabel?: string | null;
    river?: { name?: string | null } | null;
    tripType?: {
        name?: string | null;
        cardLabel?: string | null;
        tagColor?: TripTagColor | null;
    } | null;
    image?: Parameters<typeof imageUrl>[0];
}

/** Maps a TRIP_CARD projection to card props. Spread it and override what
    the call site needs — /specialty drops the description, for instance. */
export function tripCardProps(
    trip: TripCardSource,
    width = 760,
    height = 740,
): TripCardProps {
    return {
        name: trip.name ?? '',
        category: trip.tripType?.cardLabel ?? trip.tripType?.name ?? '',
        categoryColor: trip.tripType?.tagColor ?? 'teal',
        image: imageUrl(trip.image, width, height),
        startingPrice: trip.startingPrice ?? '',
        duration: trip.durationLabel ?? '',
        description: trip.tagline ?? undefined,
        subtitle: trip.subtitle ?? undefined,
        ribbon: trip.ribbon ?? undefined,
        featured: Boolean(trip.ribbon),
        river: trip.river?.name ?? undefined,
        href: trip.slug?.current ? `/trips/${trip.slug.current}` : '#',
    };
}

export function TripCard({
    name,
    category,
    categoryColor = 'teal',
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
    const tagColor = TAG_CLASSES[categoryColor];
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
                    {category && (
                        <span
                            className={`inline-block ${tagColor} px-3.5 py-1.5 text-[14px] font-bold leading-tight`}
                        >
                            {category}
                        </span>
                    )}
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
