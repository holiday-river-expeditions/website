import { Button } from '@/components/ui/Button';
import { Hero } from '@/components/ui/Hero';
import { RiverCard } from '@/components/ui/RiverCard';
import { Section } from '@/components/ui/Section';
import { TestimonialBlock } from '@/components/ui/TestimonialBlock';
import { TrustBar } from '@/components/ui/TrustBar';
import { getAllRivers, getFeaturedTrips, getHomepage } from '@/lib/sanity';
import { urlFor } from '@/lib/sanity/image';

const trustItems = [
    { label: '60 Years on the River' },
    { label: '5.0 on Google' },
    { label: "Travelers' Choice 2025" },
    { label: 'Motor-Free Since 1966' },
];

const fallbackRivers = [
    {
        name: 'Colorado River',
        description: 'Grand Canyon to Cataract — legendary whitewater',
        slug: 'colorado',
        imageUrl:
            'https://www.bikeraft.com/wp-content/uploads/2025/11/Cataract-Canyon-whitewater-rafting.png',
    },
    {
        name: 'Green River',
        description: 'Desolation Canyon and the Gates of Lodore',
        slug: 'green',
        imageUrl:
            'https://www.bikeraft.com/wp-content/uploads/2025/11/Green-River-rafting-banner.png',
    },
    {
        name: 'San Juan River',
        description: 'Ancient ruins and desert solitude',
        slug: 'san-juan',
        imageUrl:
            'https://www.bikeraft.com/wp-content/uploads/2025/11/San-Juan-River-Banner-1.png',
    },
    {
        name: 'Yampa River',
        description: "Colorado's last free-flowing river",
        slug: 'yampa',
        imageUrl:
            'https://www.bikeraft.com/wp-content/uploads/2025/10/Yampa-River-Rafting-Tiger-Wall.jpg',
    },
];

const fallbackTrips = [
    {
        name: 'Cataract Canyon',
        duration: 4,
        river: 'Colorado River',
        slug: 'cataract-canyon',
        imageUrl:
            'https://www.bikeraft.com/wp-content/uploads/2025/11/Cataract-Canyon-Rafting-Trips-4.jpg',
    },
    {
        name: 'Desolation Canyon',
        duration: 5,
        river: 'Green River',
        slug: 'desolation-canyon',
        imageUrl:
            'https://www.bikeraft.com/wp-content/uploads/2025/11/Desolation-Canyon-Rafting-Trip-3-1.jpg',
    },
    {
        name: 'San Juan River Journey',
        duration: 4,
        river: 'San Juan River',
        slug: 'san-juan-river-journey',
        imageUrl:
            'https://www.bikeraft.com/wp-content/uploads/2025/11/San-Juan-river-rafting-trips-banner.png',
    },
];

const testimonials = [
    {
        quote: 'This was the most transformative week of our lives. The guides, the canyons, the stars — everything was beyond what we imagined.',
        author: 'Sarah M.',
        trip: 'Cataract Canyon, 4 Days',
        rating: 5,
    },
    {
        quote: "We've done three trips with Holiday now. Each one feels like coming home to a place you've never been. That's the magic of it.",
        author: 'James & Linda K.',
        trip: 'Desolation Canyon, 5 Days',
        rating: 5,
    },
];

const HERO_FALLBACK_IMAGE =
    'https://www.bikeraft.com/wp-content/uploads/2025/12/SRO_0237-scaled.jpg';
const CTA_FALLBACK_IMAGE =
    'https://www.bikeraft.com/wp-content/uploads/2021/11/Dee-Holladay-Kim-Crumbo-Awards-Hero.jpg';

export default async function Home() {
    const [hp, sanityRivers, featuredTrips] = await Promise.all([
        getHomepage(),
        getAllRivers(),
        getFeaturedTrips(),
    ]);

    // Hero
    const heroImage = hp?.heroImage
        ? urlFor(hp.heroImage).width(1920).quality(80).url()
        : HERO_FALLBACK_IMAGE;
    const heroHeading = hp?.heroHeading ?? 'Holiday River Expeditions';
    const heroSubheading =
        hp?.heroSubheading ?? 'Motor-Free Rafting Since 1966';
    const heroCtaText = hp?.heroCtaText ?? 'Plan Your Trip';
    const heroCtaLink = hp?.heroCtaLink ?? '/trips';

    // The Holiday Way
    const hwTagline = hp?.holidayWayTagline ?? 'The Holiday Way';
    const hwHeading = hp?.holidayWayHeading ?? 'Go with the flow.';
    const hwBody =
        hp?.holidayWayBody ??
        "For six decades, we've believed the river knows the way. No motors. No rush. Just you, your crew, and the wild canyon country of the American West. We guide people into landscapes that change them \u2014 and we take care of every detail so you can be fully present for the experience.";

    // Final CTA
    const ctaHeading = hp?.ctaHeading ?? 'Ready for Your Adventure?';
    const ctaSubheading =
        hp?.ctaSubheading ??
        'Browse our trips, find the right river, and reserve your spot.';
    const ctaImage = hp?.ctaImage
        ? urlFor(hp.ctaImage).width(1920).quality(80).url()
        : CTA_FALLBACK_IMAGE;
    const ctaButtonText = hp?.ctaButtonText ?? 'Browse All Trips';
    const ctaButtonLink = hp?.ctaButtonLink ?? '/trips';

    // Rivers — use Sanity data if available, otherwise fallbacks
    const rivers =
        sanityRivers && sanityRivers.length > 0
            ? sanityRivers.map((r) => ({
                  name: r.name ?? '',
                  tagline: r.description ?? '',
                  href: `/trips?river=${r.slug?.current ?? ''}`,
                  backgroundImage: r.image
                      ? urlFor(r.image).width(600).quality(80).url()
                      : '',
              }))
            : fallbackRivers.map((r) => ({
                  name: r.name,
                  tagline: r.description,
                  href: `/trips?river=${r.slug}`,
                  backgroundImage: r.imageUrl,
              }));

    // Featured trips — use Sanity data if available, otherwise fallbacks
    const trips =
        featuredTrips && featuredTrips.length > 0
            ? featuredTrips.map((t) => ({
                  name: t.name ?? '',
                  duration: t.duration ?? 0,
                  river: t.river?.name ?? '',
                  slug: t.slug?.current ?? '',
                  imageUrl: t.mainImage
                      ? urlFor(t.mainImage).width(600).quality(80).url()
                      : '',
              }))
            : fallbackTrips;

    return (
        <>
            {/* Hero */}
            <Hero
                heading={heroHeading}
                subheading={heroSubheading}
                ctaText={heroCtaText}
                ctaHref={heroCtaLink}
                backgroundImage={heroImage}
            />

            {/* Trust bar */}
            <TrustBar items={trustItems} />

            {/* The Holiday Way */}
            <Section background='canyon' className='py-20 md:py-28'>
                <div className='mx-auto max-w-3xl text-center'>
                    <p className='text-link font-semibold uppercase tracking-widest text-teal'>
                        {hwTagline}
                    </p>
                    <h2 className='mt-4 text-h2 font-extrabold leading-h2 text-white'>
                        {hwHeading}
                    </h2>
                    <p className='mt-6 text-subheading leading-subheading text-white/80'>
                        {hwBody}
                    </p>
                    <div className='mx-auto mt-8 h-px w-24 bg-teal/40' />
                </div>
            </Section>

            {/* Explore by River */}
            <Section background='sand' className='py-20'>
                <div className='mb-10 text-center'>
                    <h2 className='text-h2 font-extrabold leading-h2 text-charcoal'>
                        Explore by River
                    </h2>
                    <p className='mt-3 text-paragraph leading-paragraph text-taupe'>
                        Four legendary rivers. Hundreds of miles of canyon
                        country. Your adventure starts here.
                    </p>
                </div>
                <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                    {rivers.map((river) => (
                        <RiverCard key={river.name} {...river} />
                    ))}
                </div>
            </Section>

            {/* Signature Trips */}
            <Section className='py-20'>
                <div className='mb-10 text-center'>
                    <h2 className='text-h2 font-extrabold leading-h2 text-charcoal'>
                        Signature Trips
                    </h2>
                    <p className='mt-3 text-paragraph leading-paragraph text-taupe'>
                        Our most popular adventures, hand-picked by the Holiday
                        team.
                    </p>
                </div>
                <div className='grid gap-8 md:grid-cols-3'>
                    {trips.map((trip) => (
                        <div
                            key={trip.name}
                            className='group overflow-hidden rounded-lg border-t-4 border-teal bg-white shadow-md transition-shadow hover:shadow-lg'
                        >
                            <div
                                className='aspect-4/3 bg-cover bg-center transition-transform duration-300 group-hover:scale-105'
                                style={{
                                    backgroundImage: `url(${trip.imageUrl})`,
                                }}
                            />
                            <div className='p-5'>
                                <p className='text-link font-semibold uppercase text-teal'>
                                    {trip.river} &middot; {trip.duration}{' '}
                                    {trip.duration === 1 ? 'Day' : 'Days'}
                                </p>
                                <h3 className='mt-1 text-paragraph font-bold leading-paragraph text-charcoal'>
                                    {trip.name}
                                </h3>
                                <p className='mt-3'>
                                    <Button
                                        href={`/trips/${trip.slug}`}
                                        variant='outline'
                                        size='default'
                                    >
                                        Learn More
                                    </Button>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='mt-10 text-center'>
                    <Button href='/trips' variant='teal' size='lg'>
                        View All Trips
                    </Button>
                </div>
            </Section>

            {/* Testimonials */}
            <Section background='canyon' className='py-20 md:py-28'>
                <div className='mb-10 text-center'>
                    <p className='text-link font-semibold uppercase tracking-widest text-teal'>
                        What Our Guests Say
                    </p>
                    <h2 className='mt-4 text-h2 font-extrabold leading-h2 text-white'>
                        Stories from the River
                    </h2>
                </div>
                <TestimonialBlock testimonials={testimonials} />
            </Section>

            {/* Final CTA */}
            <section className='relative flex min-h-[50vh] items-center overflow-hidden'>
                <div
                    className='absolute inset-0 bg-cover bg-center'
                    style={{
                        backgroundImage: `url(${ctaImage})`,
                    }}
                />
                <div className='absolute inset-0 bg-canyon/70' />
                <div className='relative z-10 w-full px-6 py-20 text-center'>
                    <h2 className='text-h2 font-extrabold leading-h2 text-white md:text-h1 md:leading-h1'>
                        {ctaHeading}
                    </h2>
                    <p className='mt-4 text-paragraph leading-paragraph text-white/80'>
                        {ctaSubheading}
                    </p>
                    <div className='mt-8'>
                        <Button href={ctaButtonLink} variant='teal' size='lg'>
                            {ctaButtonText}
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
