import { Button } from './Button';

interface HeroProps {
    heading: string;
    subheading: string;
    ctaText: string;
    ctaHref: string;
    backgroundImage: string;
}

export function Hero({
    heading,
    subheading,
    ctaText,
    ctaHref,
    backgroundImage,
}: HeroProps) {
    return (
        <section className='relative flex min-h-[90vh] items-end overflow-hidden'>
            {/* Background image */}
            <div
                className='absolute inset-0 bg-cover bg-center'
                style={{ backgroundImage: `url(${backgroundImage})` }}
            />

            {/* Gradient overlay — dark at bottom for text legibility */}
            <div className='absolute inset-0 bg-gradient-to-t from-canyon/95 via-canyon/40 to-transparent' />

            {/* Content */}
            <div className='relative z-10 w-full px-6 pb-16 pt-32 md:pb-24'>
                <div className='mx-auto max-w-7xl'>
                    <h1 className='font-stardos text-h1 font-bold leading-h1 tracking-tight text-brand-red md:text-[72px] md:leading-[66px]'>
                        {heading}
                    </h1>
                    <p className='mt-4 text-subheading leading-subheading text-white/90 md:text-h3 md:leading-h3'>
                        {subheading}
                    </p>
                    <div className='mt-8'>
                        <Button href={ctaHref} variant='teal' size='lg'>
                            {ctaText}
                        </Button>
                    </div>

                    {/* Scroll indicator */}
                    <div className='mt-12 flex justify-center md:justify-start'>
                        <div className='flex flex-col items-center gap-2 text-white/50'>
                            <span className='text-link uppercase tracking-widest'>
                                Scroll
                            </span>
                            <svg
                                width='16'
                                height='24'
                                viewBox='0 0 16 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='1.5'
                            >
                                <path d='M8 4v16M2 14l6 6 6-6' />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
