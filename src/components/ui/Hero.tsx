import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import { AnniversaryBadge } from '@/components/ui/AnniversaryBadge';
import { Button } from '@/components/ui/Button';
import { HeroVideo } from '@/components/ui/HeroVideo';

/** Homepage hero crop size: its 1440:600 display box at 2x DPR. Pass these
    to imageUrl / placeholderUrl for anything shown in the hero. */
export const HERO_WIDTH = 2880;
export const HERO_HEIGHT = 1200;

/** Phone crop: the hero is a fixed 460px tall below md, so a phone's box is
    portrait (390x460 on most). The wide crop would show only a third of its
    width there, upscaled. 3x of 390x460. */
export const HERO_PHONE_WIDTH = 1170;
export const HERO_PHONE_HEIGHT = 1380;

const PHONE = '(max-width: 767px)';
const WIDE = '(min-width: 768px)';

interface HeroProps {
    heading: string;
    backgroundImage: string;
    /** Tiny blurred copy of the same crop (placeholderUrl), shown while the
        full photo loads. */
    placeholderImage?: string;
    /** The same photo cropped to HERO_PHONE_WIDTH x HERO_PHONE_HEIGHT
        around the Studio hotspot, used below md. */
    phoneImage?: string;
    /** Blurred stand-in for phoneImage. */
    phonePlaceholder?: string;
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
    placeholderImage,
    phoneImage,
    phonePlaceholder,
    imageAlt = '',
    cta,
    contact,
}: HeroProps) {
    return (
        // Full-bleed banner at restrained height (well under viewport, so the
        // next section always peeks — no illusion of completeness). The seal
        // straddles the banner's bottom-left edge, so the section must not clip.
        // Desktop height tracks a 1440:600 proportion instead of a fixed pixel
        // height, so wider screens don't degrade into an ever-thinner
        // letterbox crop. The vh cap keeps the peek on short viewports.
        // Taller than the inner-page banners' 1440:523 (Darius, 2026-11-06)
        // so the photo can hold the canyon wall and the camp and rafts on
        // the beach below it.
        <section>
            <div className='relative h-[460px] md:aspect-[1440/600] md:h-auto md:max-h-[65vh] md:w-full'>
                {/* Banner image. The evergreen base keeps the white headline
                    legible before a photo is set. */}
                <div className='absolute inset-0 overflow-hidden bg-evergreen'>
                    {backgroundImage && (
                        <div className='absolute inset-0'>
                            <StudioPhoto
                                wide={backgroundImage}
                                widePlaceholder={placeholderImage}
                                phone={phoneImage}
                                phonePlaceholder={phonePlaceholder}
                                alt={imageAlt}
                            />
                        </div>
                    )}
                    {/* The video fades in over the photo once it plays.
                        The photo is the fallback and the first paint. */}
                    <HeroVideo />
                    {/* Subtle overlay for headline legibility */}
                    <div className='absolute inset-0 bg-onyx/20' />
                </div>

                {/* Headline + CTA. A soft text shadow, since the contact
                    line can land on a white raft tube in the video. */}
                <div className='relative z-10 flex h-full flex-col items-center justify-center px-6 pb-24 [text-shadow:0_1px_10px_rgb(0_0_0/0.7)] md:pb-0'>
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

                {/* Anniversary seal, straddling the bottom-left edge. The
                    year count is computed from 1966 so it never goes stale.
                    It stamps into place once on load (motion-safe only,
                    default since 2026-11-06). The wrapper owns positioning
                    so the animation's transform can't fight the translate. */}
                <span className='absolute bottom-0 left-6 z-20 block h-32 w-32 translate-y-[15%] md:left-10 md:h-48 md:w-48'>
                    <AnniversaryBadge className='h-full w-full motion-safe:animate-badge-stamp' />
                </span>
            </div>
        </section>
    );
}

/**
 * The Studio hero photo, art-directed: a wide crop from md up and a portrait
 * crop on phones, both centred by Sanity on the editor's hotspot. Each crop
 * is preloaded only at its own breakpoint, so a phone never fetches the wide
 * one. A blurred stand-in of the matching crop sits underneath, so first
 * paint shows the photo's colors and the full image draws in over it.
 */
function StudioPhoto({
    wide,
    widePlaceholder,
    phone,
    phonePlaceholder,
    alt,
}: {
    wide: string;
    widePlaceholder?: string;
    phone?: string;
    phonePlaceholder?: string;
    alt: string;
}) {
    const common = { alt, sizes: '100vw', quality: 75 };
    const {
        props: { srcSet: wideSet, ...img },
    } = getImageProps({
        ...common,
        src: wide,
        width: HERO_WIDTH,
        height: HERO_HEIGHT,
    });
    const phoneProps = phone
        ? getImageProps({
              ...common,
              src: phone,
              width: HERO_PHONE_WIDTH,
              height: HERO_PHONE_HEIGHT,
          }).props
        : undefined;

    preload(img.src, {
        as: 'image',
        imageSrcSet: wideSet,
        imageSizes: '100vw',
        fetchPriority: 'high',
        media: phoneProps ? WIDE : undefined,
    });
    if (phoneProps) {
        preload(phoneProps.src, {
            as: 'image',
            imageSrcSet: phoneProps.srcSet,
            imageSizes: '100vw',
            fetchPriority: 'high',
            media: PHONE,
        });
    }

    return (
        <>
            {widePlaceholder && (
                <div
                    aria-hidden
                    className={`absolute inset-0 bg-cover bg-center ${
                        phonePlaceholder ? 'hidden md:block' : ''
                    }`}
                    style={{ backgroundImage: `url(${widePlaceholder})` }}
                />
            )}
            {phonePlaceholder && (
                <div
                    aria-hidden
                    className='absolute inset-0 bg-cover bg-center md:hidden'
                    style={{ backgroundImage: `url(${phonePlaceholder})` }}
                />
            )}
            <picture>
                {phoneProps && (
                    <source
                        media={PHONE}
                        srcSet={phoneProps.srcSet}
                        sizes='100vw'
                    />
                )}
                <img
                    {...img}
                    srcSet={wideSet}
                    alt={alt}
                    loading='eager'
                    fetchPriority='high'
                    className='absolute inset-0 h-full w-full object-cover motion-safe:animate-hero-drift'
                />
            </picture>
        </>
    );
}
