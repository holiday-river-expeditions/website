interface HeroProps {
    heading: string;
    backgroundImage: string;
}

export function Hero({ heading, backgroundImage }: HeroProps) {
    return (
        <section className='relative flex min-h-[70vh] items-center justify-center overflow-hidden md:min-h-[78vh]'>
            {/* Background image */}
            <div
                className='absolute inset-0 bg-cover bg-center'
                style={{ backgroundImage: `url(${backgroundImage})` }}
            />

            {/* Subtle overlay for headline legibility */}
            <div className='absolute inset-0 bg-onyx/20' />

            {/* Content */}
            <div className='relative z-10 w-full px-6'>
                <div className='mx-auto max-w-5xl text-center'>
                    <h1 className='font-alt-gothic text-h2 font-medium uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                        {heading}
                    </h1>
                </div>
            </div>
        </section>
    );
}
