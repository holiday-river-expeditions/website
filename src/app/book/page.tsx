import type { Metadata } from 'next';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';

export const metadata: Metadata = {
    title: 'Book Your Trip',
    description:
        'Reserve your Holiday River Expeditions rafting or biking trip.',
};

// Placeholder until the Arctic Reservations integration lands (see
// docs/project/arctic-api.md). Books by phone in the meantime — never a 404
// on the revenue path.
export default function BookPage() {
    return (
        <Section background='white' className='py-24 md:py-32'>
            <div className='mx-auto max-w-2xl text-center'>
                <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    Let&apos;s get you
                    <br />
                    on the river
                </h1>
                <p className='mt-6 text-paragraph leading-paragraph text-onyx'>
                    Check live availability on the Open Seats page, or let our
                    crew in Salt Lake City set you up in one call: dates, gear
                    questions, all of it.
                </p>
                <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
                    <Button href='/open-seats' size='lg'>
                        See Open Seats
                    </Button>
                    <a
                        href='tel:+18012662087'
                        className={buttonClasses({
                            variant: 'primary',
                            size: 'xl',
                        })}
                    >
                        Call 801-266-2087
                    </a>
                </div>
                <p className='mt-4 text-body leading-body text-onyx/70'>
                    Monday–Friday, 8am–5pm Mountain Time
                </p>
                <div className='mt-12'>
                    <Button href='/trips' variant='outline' size='lg'>
                        Still Deciding? Explore Trips
                    </Button>
                </div>
            </div>
        </Section>
    );
}
