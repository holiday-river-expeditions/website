import Image from 'next/image';

interface HeroProps {
    heading: string;
    backgroundImage: string;
}

export function Hero({ heading, backgroundImage }: HeroProps) {
    return (
        // Inset banner — image sits below the header with side margins (per mockup),
        // not full-bleed. The seal straddles the banner's bottom-left edge, so the
        // outer section must not clip.
        <section className='px-4 pt-3 md:px-10 md:pt-4'>
            <div className='relative h-[420px] md:h-[523px]'>
                {/* Banner image, clipped to the inset rectangle. The evergreen
                    base keeps the white headline legible before a photo is set. */}
                <div className='absolute inset-0 overflow-hidden bg-evergreen'>
                    <div
                        className='absolute inset-0 bg-cover bg-center'
                        style={{ backgroundImage: `url(${backgroundImage})` }}
                    />
                    {/* Subtle overlay for headline legibility */}
                    <div className='absolute inset-0 bg-onyx/20' />
                </div>

                {/* Headline */}
                <div className='relative z-10 flex h-full items-center justify-center px-6'>
                    <h1 className='mx-auto max-w-5xl text-center font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                        {heading}
                    </h1>
                </div>

                {/* 60-years anniversary seal — straddles the bottom-left edge */}
                <Image
                    src='/badge-60-years.svg'
                    alt='60 years of going with the flow'
                    width={164}
                    height={164}
                    priority
                    className='absolute bottom-0 left-6 z-20 h-28 w-28 translate-y-[15%] md:left-10 md:h-40 md:w-40'
                />
            </div>
        </section>
    );
}
