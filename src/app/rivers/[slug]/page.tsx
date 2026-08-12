import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { TripCard } from '@/components/ui/TripCard';
import { getRiverBySlug, imageUrl } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

interface RiverPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({
    params,
}: RiverPageProps): Promise<Metadata> {
    const { slug } = await params;
    const river = await getRiverBySlug(slug);
    if (!river) return {};
    return {
        title: river.name ? `${river.name} River` : undefined,
        description: river.description ?? undefined,
    };
}

export default async function RiverPage({ params }: RiverPageProps) {
    const { slug } = await params;
    const river = await getRiverBySlug(slug);
    if (!river) notFound();

    const heroPhoto = imageUrl(river.image, 2560, 900);
    const trips = river.trips ?? [];

    return (
        <>
            {/* Banner — inset like the homepage hero */}
            <section>
                <div className='relative flex h-[320px] items-end overflow-hidden bg-evergreen md:h-[440px]'>
                    {heroPhoto && (
                        <Image
                            src={heroPhoto}
                            alt={river.name ?? ''}
                            fill
                            priority
                            className='object-cover'
                            sizes='100vw'
                        />
                    )}
                    <div className='absolute inset-0 bg-gradient-to-t from-onyx/70 via-onyx/10 to-transparent' />
                    <div className='relative z-10 w-full px-6 pb-10 md:px-12'>
                        <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-white md:text-h1 md:leading-h1'>
                            {river.name}
                        </h1>
                    </div>
                </div>
            </section>

            {/* Description */}
            <Section background='white' className='py-12 md:py-16'>
                {river.description ? (
                    <p className='max-w-3xl text-paragraph leading-paragraph text-onyx'>
                        {river.description}
                    </p>
                ) : (
                    <p className='max-w-3xl text-body leading-body text-onyx/70'>
                        River description coming soon. Add it in the Studio.
                    </p>
                )}
            </Section>

            {/* Trips on this river */}
            {trips.length > 0 && (
                <Section background='white' className='pb-20 pt-0 md:pb-24'>
                    <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-red'>
                        Trips on the {river.name}
                    </h2>
                    <div
                        data-reveal-stagger
                        className='mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                    >
                        {trips.map((trip) => (
                            <TripCard
                                key={trip._id}
                                name={trip.name ?? ''}
                                category={trip.category ?? ''}
                                image={imageUrl(trip.image, 760, 740)}
                                startingPrice={trip.startingPrice ?? ''}
                                duration={trip.durationLabel ?? ''}
                                description={trip.tagline ?? undefined}
                                subtitle={trip.subtitle ?? undefined}
                                ribbon={trip.ribbon ?? undefined}
                                featured={Boolean(trip.ribbon)}
                                difficulty={trip.difficulty ?? undefined}
                                href={
                                    trip.slug?.current
                                        ? `/trips/${trip.slug.current}`
                                        : '#'
                                }
                            />
                        ))}
                    </div>
                    <div className='mt-14 text-center'>
                        <Button href='/trips' variant='outline' size='lg'>
                            View All Trips
                        </Button>
                    </div>
                </Section>
            )}
        </>
    );
}
