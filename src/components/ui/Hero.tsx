import Image from 'next/image';
import { AnniversaryBadge } from '@/components/ui/AnniversaryBadge';
import { Button } from '@/components/ui/Button';
import { HeroVideo } from '@/components/ui/HeroVideo';
import {
    PAGE_BANNER_HEIGHT,
    PAGE_BANNER_WIDTH,
} from '@/components/ui/PageBanner';
import { imageUrl } from '@/lib/sanity';

/**
 * Branded alternatives to the Studio hero photo, behind the `hero-*` demo
 * flags (a radio group, so one at most). Each is a Holiday raft with the
 * logo on the tube, picked from photos already in the Sanity media
 * library. They render hidden and without preload, so lazy loading keeps
 * real visitors from downloading them. Precedence if storage ever holds
 * more than one: major > one-eye > eddy. To graduate one, set it as the
 * Hero Background Image in the Studio and delete this list and its flags.
 */
const BRANDED_HERO_PHOTOS = [
    {
        flag: 'major',
        assetRef:
            'image-621ee9735b013a0dba8118f3106ecca8d1c0f9f6-2000x1414-png',
        focus: { x: 0.5, y: 0.5 },
        alt: 'A family splashing through a rapid in a Holiday raft named The Major',
        visibility: 'hidden [[data-demo-hero-major=on]_&]:block',
    },
    {
        flag: 'one-eye',
        assetRef:
            'image-5c44b18ba0eadda4ca8dd870f519deb3416a1dc9-2496x1664-jpg',
        focus: { x: 0.5, y: 0.5 },
        alt: 'Kids laughing in the bow of the Holiday raft One-Eye Smith',
        visibility:
            'hidden [[data-demo-hero-one-eye=on]:not([data-demo-hero-major=on])_&]:block',
    },
    {
        flag: 'eddy',
        assetRef:
            'image-3aa7315ce8aaf2507148a666c7c61afad22c863a-1920x1281-jpg',
        // Raised so the crew's faces stay in the wide crop.
        focus: { x: 0.5, y: 0.42 },
        alt: 'A guide rowing the Holiday raft Eddy through white water',
        visibility:
            'hidden [[data-demo-hero-eddy=on]:not([data-demo-hero-major=on]):not([data-demo-hero-one-eye=on])_&]:block',
    },
].map((photo) => {
    // Shaped like a Studio image field so imageUrl honors the hotspot.
    const source = {
        asset: { _ref: photo.assetRef },
        crop: { top: 0, bottom: 0, left: 0, right: 0 },
        hotspot: { ...photo.focus, width: 1, height: 1 },
    };
    return {
        ...photo,
        src: imageUrl(source, PAGE_BANNER_WIDTH, PAGE_BANNER_HEIGHT),
    };
});

interface HeroProps {
    heading: string;
    backgroundImage: string;
    /** Alt text for the banner photo; empty string = decorative. */
    imageAlt?: string;
    /** The authored button under the headline (Homepage → Hero in the
        Studio). Editors point it wherever the season needs — /trip-finder
        for the wizard, /trips for the grid. */
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
                        <div className='absolute inset-0 [[data-demo-hero-eddy=on]_&]:hidden [[data-demo-hero-major=on]_&]:hidden [[data-demo-hero-one-eye=on]_&]:hidden [[data-demo-hero-video=on]_&]:hidden'>
                            <Image
                                src={backgroundImage}
                                alt={imageAlt}
                                fill
                                preload
                                sizes='100vw'
                                className='object-cover motion-safe:animate-hero-drift'
                            />
                        </div>
                    )}
                    {BRANDED_HERO_PHOTOS.map((photo) => (
                        <div
                            key={photo.flag}
                            data-hero-photo={photo.flag}
                            className={`absolute inset-0 ${photo.visibility}`}
                        >
                            <Image
                                src={photo.src}
                                alt={photo.alt}
                                fill
                                sizes='100vw'
                                className='object-cover motion-safe:animate-hero-drift'
                            />
                            {/* Close-up action shots are busier behind
                                the headline than the canyon landscape,
                                and the white raft tubes sit right under
                                the contact line, so they get extra shade
                                weighted to the middle where the text is. */}
                            <div className='absolute inset-0 bg-radial from-onyx/50 to-onyx/10' />
                        </div>
                    ))}
                    {/* Draws over the photos when the hero-video flag
                        is on, and renders nothing otherwise. */}
                    <HeroVideo />
                    {/* Subtle overlay for headline legibility */}
                    <div className='absolute inset-0 bg-onyx/20' />
                </div>

                {/* Headline + CTA. The branded demo photos and video add a
                    soft text shadow, since the contact line can land on a
                    white raft tube. */}
                <div className='relative z-10 flex h-full flex-col items-center justify-center px-6 pb-24 md:pb-0 [[data-demo-hero-eddy=on]_&]:[text-shadow:0_1px_10px_rgb(0_0_0/0.7)] [[data-demo-hero-major=on]_&]:[text-shadow:0_1px_10px_rgb(0_0_0/0.7)] [[data-demo-hero-one-eye=on]_&]:[text-shadow:0_1px_10px_rgb(0_0_0/0.7)] [[data-demo-hero-video=on]_&]:[text-shadow:0_1px_10px_rgb(0_0_0/0.7)]'>
                    <h1 className='mx-auto max-w-5xl text-center font-alt-gothic text-[34px] font-black uppercase leading-[0.95] text-holiday-white sm:text-h2 sm:leading-h2 md:text-h1 md:leading-h1'>
                        {heading}
                    </h1>
                    {cta && (
                        <div className='mt-8'>
                            {/* The trip finder is green site-wide. Red
                                stays for booking. */}
                            <Button
                                href={cta.href}
                                size='lg'
                                variant={
                                    cta.href.startsWith('/trip-finder')
                                        ? 'evergreen'
                                        : 'primary'
                                }
                            >
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

                {/* Anniversary seal — straddles the bottom-left edge. Same
                    artwork, with the year count computed from 1966 so it
                    never goes stale; the badge-live demo flag adds the
                    one-time stamp-in settle (motion-safe only). The wrapper
                    owns positioning so the animation's transform can't
                    fight the translate. */}
                <span className='absolute bottom-0 left-6 z-20 block h-32 w-32 translate-y-[15%] md:left-10 md:h-48 md:w-48'>
                    <AnniversaryBadge className='h-full w-full motion-safe:[[data-demo-badge-live=on]_&]:animate-badge-stamp' />
                </span>
            </div>
        </section>
    );
}
