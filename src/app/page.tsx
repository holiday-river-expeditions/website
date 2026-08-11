import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ContentCard } from '@/components/ui/ContentCard';
import { Hero } from '@/components/ui/Hero';
import { RiverSelector } from '@/components/ui/RiverSelector';
import { Section } from '@/components/ui/Section';
import { TripCard, type TripCardProps } from '@/components/ui/TripCard';
import { getHomepage, imageUrl } from '@/lib/sanity';

// Re-fetch from Sanity at most once a minute so content edits in /studio appear
// on the live site without a redeploy. (Swap for webhook-based on-demand
// revalidation later if the team wants near-instant updates.)
export const revalidate = 60;

export default async function Home() {
    const homepage = await getHomepage();

    if (!homepage) {
        return (
            <Section background='white' className='py-24'>
                <p className='text-body text-onyx'>
                    Homepage content hasn’t been set up yet. Add it in the{' '}
                    <Link className='text-holiday-red underline' href='/studio'>
                        Studio
                    </Link>
                    .
                </p>
            </Section>
        );
    }

    const featuredTrips: TripCardProps[] = (homepage.featuredTrips ?? []).map(
        (trip) => ({
            name: trip.name ?? '',
            category: trip.category ?? '',
            image: imageUrl(trip.image, 760, 740),
            startingPrice: trip.startingPrice ?? '',
            duration: trip.durationLabel ?? '',
            description: trip.tagline ?? undefined,
            href: trip.slug?.current ? `/trips/${trip.slug.current}` : '#',
            subtitle: trip.subtitle ?? undefined,
            ribbon: trip.ribbon ?? undefined,
            featured: Boolean(trip.ribbon),
            difficulty: trip.difficulty ?? undefined,
        }),
    );

    const rivers = (homepage.rivers ?? []).map((river) => ({
        name: river.name ?? '',
        href: river.slug?.current ? `/rivers/${river.slug.current}` : '#',
        image: imageUrl(river.image, 1600, 1000),
    }));

    const learnContent = (homepage.learnContent ?? []).map((card) => ({
        title: card.title ?? '',
        image: imageUrl(card.image, 616, 856),
        href: card.link ?? '#',
        isVideo: card.isVideo ?? false,
    }));

    // Banner-shaped crop (~2.6:1, matching the mock's 1359x523 hero) so the
    // editor-set hotspot in Studio controls which part of the photo shows.
    const heroImage = imageUrl(homepage.heroImage, 2000, 770);
    const storyImageLeft = imageUrl(homepage.storyImageLeft, 700, 933);
    const storyImagePortrait = imageUrl(homepage.storyImagePortrait, 700, 933);

    return (
        <>
            {/* Hero — CTA is the low-commitment exploration entry; the nav's
                Book Now stays the persistent high-commitment action. */}
            <Hero
                heading={homepage.heroHeading ?? ''}
                backgroundImage={heroImage}
                imageAlt={homepage.heroImageAlt ?? ''}
                cta={{
                    text: homepage.heroCtaText ?? 'Find Your Trip',
                    href: homepage.heroCtaLink ?? '/trips',
                }}
            />

            {/* Trip Grid */}
            <Section background='white' className='py-20 md:py-24'>
                <div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-3'>
                    {featuredTrips.map((trip) => (
                        <TripCard key={trip.href} {...trip} />
                    ))}
                </div>
                <div className='mt-14 text-center'>
                    <Button href='/trips' variant='outline' size='lg'>
                        View All Trips
                    </Button>
                </div>
            </Section>

            {/* Rafting Since 1966 */}
            <Section background='white' className='py-20 md:py-24'>
                <div className='grid items-center gap-10 md:grid-cols-[1.3fr_1fr]'>
                    {/* Left: two-image collage */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='relative aspect-[3/4] overflow-hidden bg-holiday-grey/15'>
                            {storyImageLeft && (
                                <Image
                                    src={storyImageLeft}
                                    alt='Vintage Holiday River Expeditions rafting trip'
                                    fill
                                    className='object-cover'
                                    sizes='(max-width: 768px) 50vw, 30vw'
                                />
                            )}
                        </div>
                        {/* Portrait cell is `relative` (no clip of its own) so the
                            founder signature + arrow can be absolutely positioned
                            over its bottom-right corner and stay anchored to it at
                            any screen size. The photo is clipped by the inner div. */}
                        <div className='relative aspect-[3/4] translate-y-8'>
                            <div className='absolute inset-0 overflow-hidden bg-holiday-grey/15'>
                                {storyImagePortrait && (
                                    <Image
                                        src={storyImagePortrait}
                                        alt='Dee Holladay, founder of Holiday River Expeditions'
                                        fill
                                        className='object-cover grayscale'
                                        sizes='(max-width: 768px) 50vw, 30vw'
                                    />
                                )}
                            </div>

                            {/* Founder signature, composed from two separate exports.
                                Mock geometry (% of the portrait box, from the Figma
                                API): signature sits fully OUTSIDE the photo's right
                                edge (left edge at 106%), bottom-aligned; the arrow
                                bridges from it back into the photo (left 84%, width
                                26%, 4% up from the bottom), pointing at Dee. Mobile
                                pulls both onto the photo corner so nothing overflows
                                the viewport. */}
                            <Image
                                src='/hand-drawn-arrow.svg'
                                alt=''
                                aria-hidden='true'
                                width={122}
                                height={63}
                                className='absolute bottom-[10%] left-[58%] z-10 w-[26%] md:bottom-[4%] md:left-[84%]'
                            />
                            <Image
                                src='/dee-holiday-signature.svg'
                                alt='Dee Holladay'
                                width={129}
                                height={67}
                                className='absolute bottom-0 left-[68%] z-10 w-[31%] md:left-[106%]'
                            />
                        </div>
                    </div>

                    {/* Right: copy */}
                    <div>
                        <h2 className='font-alt-gothic text-h1 font-black uppercase leading-h1 text-holiday-red'>
                            Rafting
                            <br />
                            Since
                            <br />
                            1966
                        </h2>
                        {homepage.storyBody && (
                            <p className='mt-6 text-[20px] leading-[1.1] text-onyx'>
                                {homepage.storyBody}
                            </p>
                        )}
                        {homepage.storyCtaText && (
                            <div className='mt-8'>
                                <Button
                                    href={homepage.storyCtaLink ?? '/about'}
                                    variant='outline'
                                >
                                    {homepage.storyCtaText}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Section>

            {/* Rivers Selector */}
            {rivers.length > 0 && <RiverSelector rivers={rivers} />}

            {/* Learn & Get Inspired */}
            <Section background='white' className='py-20 md:py-24'>
                <h2 className='font-alt-gothic text-[36px] font-black uppercase leading-[0.9] text-holiday-red'>
                    Learn &amp; Get Inspired
                </h2>
                <div className='mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                    {learnContent.map((item) => (
                        <ContentCard key={item.href} {...item} />
                    ))}
                </div>
                <div className='mt-14 text-center'>
                    <Button href='/blog' variant='outline' size='lg'>
                        Read the Blog
                    </Button>
                </div>
            </Section>
        </>
    );
}
