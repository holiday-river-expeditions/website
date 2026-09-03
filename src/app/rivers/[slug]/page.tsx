import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { RiverFlow } from '@/components/ui/RiverFlow';
import { Section } from '@/components/ui/Section';
import { TripCard, tripCardProps } from '@/components/ui/TripCard';
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
    // Never append "River" to the name: sections are named by stretch, so
    // that would invent "Maze River" and "White Rim River".
    return {
        title: river.name ?? undefined,
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
                        {/* Cards link here labelled by river ("Colorado
                            River") while the page is titled by section
                            ("Westwater"); naming both closes that gap. */}
                        {river.riverLabel &&
                            river.riverLabel !== river.name && (
                                <p className='mt-2 font-alt-gothic text-subheading font-black uppercase leading-[0.95] text-holiday-white/80'>
                                    {river.riverLabel}
                                </p>
                            )}
                    </div>
                </div>
            </section>

            {/* Description */}
            <Section background='white' className='py-12 md:py-16'>
                {/* No placeholder when empty — an unwritten description should
                    read as a shorter page, not as a note to the editor. */}
                {river.description && (
                    <p className='max-w-3xl text-paragraph leading-paragraph text-onyx'>
                        {river.description}
                    </p>
                )}
                {/* Live CFS from USGS; renders nothing without a gauge. */}
                <div className='mt-4'>
                    <RiverFlow
                        variant='inline'
                        siteIds={river.usgsSiteId}
                        href={river.flowLinkUrl}
                    />
                </div>
            </Section>

            {/* Trips on this river */}
            {trips.length > 0 && (
                <Section background='white' className='pb-20 pt-0 md:pb-24'>
                    <h2 className='font-alt-gothic text-section font-black uppercase text-holiday-red'>
                        Trips on the {river.riverLabel ?? river.name}
                    </h2>
                    <div
                        data-reveal-stagger
                        className='mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                    >
                        {trips.map((trip) => (
                            <TripCard key={trip._id} {...tripCardProps(trip)} />
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
