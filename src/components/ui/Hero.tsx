import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface HeroProps {
    heading: string;
    backgroundImage: string;
    /** Alt text for the banner photo; empty string = decorative. */
    imageAlt?: string;
    cta?: { text: string; href: string };
    /** Phone/email shown under the CTA (Aug 20 decision: contact in the hero). */
    contact?: { phone?: string; email?: string };
}

export function Hero({
    heading,
    backgroundImage,
    imageAlt = '',
    cta,
    contact,
}: HeroProps) {
    return (
        // Full-bleed banner at restrained height (well under viewport, so the
        // next section always peeks — no illusion of completeness). The seal
        // straddles the banner's bottom-left edge, so the section must not clip.
        // Desktop height tracks the mock's 1440:523 banner proportion instead of
        // a fixed pixel height, so wider screens don't degrade into an
        // ever-thinner letterbox crop; the vh cap keeps the peek on short
        // viewports.
        <section>
            <div className='relative h-[460px] md:aspect-[1440/523] md:h-auto md:max-h-[75vh] md:w-full'>
                {/* Banner image. The evergreen base keeps the white headline
                    legible before a photo is set. */}
                <div className='absolute inset-0 overflow-hidden bg-evergreen'>
                    {backgroundImage && (
                        <Image
                            src={backgroundImage}
                            alt={imageAlt}
                            fill
                            preload
                            sizes='100vw'
                            className='object-cover motion-safe:animate-hero-drift'
                        />
                    )}
                    {/* Subtle overlay for headline legibility */}
                    <div className='absolute inset-0 bg-onyx/20' />
                </div>

                {/* Headline + CTA */}
                <div className='relative z-10 flex h-full flex-col items-center justify-center px-6 pb-24 md:pb-0'>
                    <h1 className='mx-auto max-w-5xl text-center font-alt-gothic text-[34px] font-black uppercase leading-[0.95] text-holiday-white sm:text-h2 sm:leading-h2 md:text-h1 md:leading-h1'>
                        {heading}
                    </h1>
                    {cta && (
                        <div className='mt-8'>
                            <Button href={cta.href} size='lg'>
                                {cta.text}
                            </Button>
                        </div>
                    )}
                    {contact && (contact.phone || contact.email) && (
                        <p className='mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[15px] font-bold leading-tight text-holiday-white md:text-[16px]'>
                            {contact.phone && (
                                <a
                                    href={`tel:+1${contact.phone.replace(/\D/g, '')}`}
                                    className='transition-opacity hover:opacity-70'
                                >
                                    {contact.phone}
                                </a>
                            )}
                            {contact.phone && contact.email && (
                                <span aria-hidden>·</span>
                            )}
                            {contact.email && (
                                <a
                                    href={`mailto:${contact.email}`}
                                    className='transition-opacity hover:opacity-70'
                                >
                                    {contact.email}
                                </a>
                            )}
                        </p>
                    )}
                </div>

                {/* 60-years anniversary seal — straddles the bottom-left
                    edge. Same artwork always; the badge-live demo flag adds
                    the one-time stamp-in settle (motion-safe only). The
                    wrapper owns positioning so the animation's transform
                    can't fight the translate. */}
                <span className='absolute bottom-0 left-6 z-20 block h-32 w-32 translate-y-[15%] md:left-10 md:h-48 md:w-48'>
                    <Image
                        src='/badge-60-years.svg'
                        alt='60 years of going with the flow'
                        width={164}
                        height={164}
                        preload
                        className='h-full w-full motion-safe:[[data-demo-badge-live=on]_&]:animate-badge-stamp'
                    />
                </span>
            </div>
        </section>
    );
}
