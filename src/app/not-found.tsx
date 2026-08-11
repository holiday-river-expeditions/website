import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';

export default function NotFound() {
    return (
        <Section background='white' className='py-24 md:py-32'>
            <div className='mx-auto max-w-2xl text-center'>
                <p className='font-alt-gothic text-h3 font-medium uppercase leading-h3 text-onyx/70'>
                    404
                </p>
                <h1 className='mt-4 font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    Looks like you
                    <br />
                    missed the take-out
                </h1>
                <p className='mt-6 text-paragraph leading-paragraph text-onyx'>
                    This page doesn&apos;t exist — but the river&apos;s still
                    out there.
                </p>
                <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
                    <Button href='/trips' size='lg'>
                        Explore Trips
                    </Button>
                    <Button href='/' variant='outline' size='lg'>
                        Back Home
                    </Button>
                </div>
            </div>
        </Section>
    );
}
