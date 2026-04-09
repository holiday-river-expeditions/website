import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ContentCard } from '@/components/ui/ContentCard';
import { Hero } from '@/components/ui/Hero';
import { RiverSelector } from '@/components/ui/RiverSelector';
import { Section } from '@/components/ui/Section';
import { TripCard, type TripCardProps } from '@/components/ui/TripCard';

const HERO_IMAGE =
    'https://www.bikeraft.com/wp-content/uploads/2025/12/SRO_0237-scaled.jpg';

const HERO_HEADING =
    'Multi-Day Raft and Bike Expeditions in the Heart of Canyon Country';

const featuredTrips: TripCardProps[] = [
    {
        name: 'Cataract Canyon',
        category: 'Whitewater Rafting',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/Cataract-Canyon-Rafting-Trips-4.jpg',
        startingPrice: '$1,830',
        duration: '5/6 Days',
        description:
            'Legendary whitewater through the heart of Canyonlands National Park.',
        href: '/trips/cataract-canyon',
    },
    {
        name: 'Westwater Canyon',
        category: 'Whitewater Rafting',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/Westwater-Canyon-Rafting-Trips.jpg',
        startingPrice: '$595',
        duration: '2/3 Days',
        description: 'World-class whitewater within a weekend.',
        href: '/trips/westwater-canyon',
    },
    {
        name: 'The Maze',
        category: 'Mountain Biking',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/The-Maze-Canyonlands.jpg',
        startingPrice: '$1,415',
        duration: '4/5 Days',
        description:
            'Bike in solitude in the least-visited district of Canyonlands.',
        href: '/trips/the-maze',
    },
    {
        name: 'Gates of Lodore',
        category: 'Whitewater Rafting',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/Gates-of-Lodore-Rafting.jpg',
        startingPrice: '$1,385',
        duration: '3/4 Days',
        description:
            'Experience Dinosaur National Monument from a scenic river.',
        href: '/trips/gates-of-lodore',
    },
    {
        name: 'The White Rim',
        category: 'Mountain Biking',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/White-Rim-Mountain-Biking.jpg',
        startingPrice: '$1,415',
        duration: '3/4 Days',
        description: 'An iconic desert mountain biking expedition.',
        href: '/trips/white-rim',
    },
    {
        name: 'Yampa River',
        category: 'Whitewater Rafting',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/10/Yampa-River-Rafting-Tiger-Wall.jpg',
        startingPrice: '$1,385',
        duration: '4/5 Days',
        description: 'Stunning beauty on a free-flowing river.',
        href: '/trips/yampa',
    },
];

const rivers = [
    {
        name: 'Desolation',
        href: '/rivers/desolation',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/Desolation-Canyon-Rafting-Trip-3-1.jpg',
    },
    {
        name: 'Yampa',
        href: '/rivers/yampa',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/10/Yampa-River-Rafting-Tiger-Wall.jpg',
    },
    {
        name: 'Gates of Lodore',
        href: '/rivers/gates-of-lodore',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/Gates-of-Lodore-Rafting.jpg',
    },
    {
        name: 'Westwater',
        href: '/rivers/westwater',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/Westwater-Canyon-Rafting-Trips.jpg',
    },
    {
        name: 'Cataract',
        href: '/rivers/cataract',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/Cataract-Canyon-whitewater-rafting.png',
    },
    {
        name: 'San Juan',
        href: '/rivers/san-juan',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/San-Juan-River-Banner-1.png',
    },
    {
        name: 'White Rim',
        href: '/rivers/white-rim',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/White-Rim-Mountain-Biking.jpg',
    },
    {
        name: 'Maze',
        href: '/rivers/maze',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/The-Maze-Canyonlands.jpg',
    },
    {
        name: 'San Rafael',
        href: '/rivers/san-rafael',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/San-Rafael-Swell.jpg',
    },
];

const learnContent = [
    {
        title: 'River Cooking 101',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/river-cooking.jpg',
        href: '/blog/river-cooking-101',
    },
    {
        title: 'Triple Rig History',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/triple-rig-history.jpg',
        href: '/blog/triple-rig-history',
    },
    {
        title: 'Packing For Your Trip',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/packing-for-trip.jpg',
        href: '/blog/packing-for-your-trip',
        isVideo: true,
    },
    {
        title: 'Stargazing On The River',
        image: 'https://www.bikeraft.com/wp-content/uploads/2025/11/stargazing-on-river.jpg',
        href: '/blog/stargazing-on-the-river',
    },
];

const motorFreeImages = {
    left: 'https://www.bikeraft.com/wp-content/uploads/2021/11/Holiday-River-Rafting-vintage.jpg',
    right: 'https://www.bikeraft.com/wp-content/uploads/2021/11/Dee-Holladay-portrait.jpg',
};

export default function Home() {
    return (
        <>
            {/* Hero */}
            <Hero heading={HERO_HEADING} backgroundImage={HERO_IMAGE} />

            {/* Trip Grid */}
            <Section background='white' className='py-20 md:py-24'>
                <div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-3'>
                    {featuredTrips.map((trip) => (
                        <TripCard key={trip.name} {...trip} />
                    ))}
                </div>
                <div className='mt-14 text-center'>
                    <Button href='/trips' variant='outline' size='lg'>
                        View All Trips
                    </Button>
                </div>
            </Section>

            {/* Motor-Free Since 1966 */}
            <Section background='white' className='py-20 md:py-24'>
                <div className='grid items-center gap-10 md:grid-cols-[1.3fr_1fr]'>
                    {/* Left: two-image collage */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='relative aspect-[3/4] overflow-hidden'>
                            <Image
                                src={motorFreeImages.left}
                                alt='Vintage Holiday River Expeditions rafting trip'
                                fill
                                className='object-cover'
                                sizes='(max-width: 768px) 50vw, 30vw'
                            />
                        </div>
                        <div className='relative aspect-[3/4] translate-y-8 overflow-hidden'>
                            <Image
                                src={motorFreeImages.right}
                                alt='Holiday River Expeditions guide portrait'
                                fill
                                className='object-cover grayscale'
                                sizes='(max-width: 768px) 50vw, 30vw'
                            />
                        </div>
                    </div>

                    {/* Right: copy */}
                    <div>
                        <h2 className='font-alt-gothic text-h2 font-medium uppercase leading-h2 text-holiday-red'>
                            Motor-Free Rafting
                            <br />
                            Since 1966
                        </h2>
                        <p className='mt-6 text-body leading-body text-onyx'>
                            From the Holiday family to all of our guests over
                            the decades: Thank you for making us the company we
                            are today. Here&apos;s to many more years of joyful
                            moments shared in wild places.
                        </p>
                        <div className='mt-8'>
                            <Button href='/about' variant='outline'>
                                Learn More
                            </Button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Rivers Selector */}
            <RiverSelector rivers={rivers} />

            {/* Learn & Get Inspired */}
            <Section background='white' className='py-20 md:py-24'>
                <h2 className='font-alt-gothic text-h2 font-medium uppercase leading-h2 text-holiday-red'>
                    Learn &amp; Get Inspired
                </h2>
                <div className='mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                    {learnContent.map((item) => (
                        <ContentCard key={item.title} {...item} />
                    ))}
                </div>
                <div className='mt-14 text-center'>
                    <Button href='/blog' variant='outline' size='lg'>
                        Learn More
                    </Button>
                </div>
            </Section>
        </>
    );
}
