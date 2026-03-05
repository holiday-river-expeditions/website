import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';

export default function Home() {
    return (
        <>
            {/* Hero */}
            <Section background="charcoal" className="py-24 text-center">
                <h1 className="font-stardos text-h1 font-bold leading-h1 tracking-tight text-brand-red">
                    Holiday River Expeditions
                </h1>
                <p className="mt-4 font-stardos text-h3 font-bold leading-h3 text-white">
                    Since 1966
                </p>
                <p className="mt-6 text-paragraph leading-paragraph text-light-gray">
                    Guided whitewater rafting and nature experiences in Colorado
                    and Utah.
                </p>
            </Section>

            {/* Intro */}
            <Section>
                <div className="mx-auto max-w-2xl">
                    <p className="text-paragraph font-bold leading-paragraph text-taupe">
                        For over 60 years, Holiday River Expeditions has been
                        guiding adventurers through the breathtaking rivers and
                        canyons of the American West.
                    </p>
                    <p className="mt-4 text-body leading-body text-taupe">
                        From multi-day rafting trips on the Colorado River to
                        scenic canyon hikes, every expedition is crafted for
                        unforgettable experiences.
                    </p>
                </div>
            </Section>

            {/* CTA */}
            <Section background="off-white" className="text-center">
                <h2 className="text-h3 font-extrabold leading-h3 text-charcoal">
                    Ready for Your Next Adventure?
                </h2>
                <div className="mt-6">
                    <Button href="/open-seats" size="lg">
                        View Open Seats
                    </Button>
                </div>
            </Section>
        </>
    );
}
