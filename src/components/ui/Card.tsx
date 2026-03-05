import Image from 'next/image';
import Link from 'next/link';

interface CardProps {
    title: string;
    href: string;
    description?: string;
    imageSrc?: string;
    imageAlt?: string;
    meta?: string;
    className?: string;
}

export function Card({
    title,
    href,
    description,
    imageSrc,
    imageAlt,
    meta,
    className = '',
}: CardProps) {
    return (
        <Link
            href={href}
            className={`group block overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg ${className}`}
        >
            {imageSrc && (
                <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                        src={imageSrc}
                        alt={imageAlt ?? title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                </div>
            )}
            <div className="p-5">
                {meta && (
                    <p className="text-link font-semibold uppercase text-light-gray">
                        {meta}
                    </p>
                )}
                <h3 className="mt-1 text-paragraph font-bold leading-paragraph text-charcoal">
                    {title}
                </h3>
                {description && (
                    <p className="mt-2 text-body leading-body text-taupe line-clamp-2">
                        {description}
                    </p>
                )}
            </div>
        </Link>
    );
}
