import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { getAllFaqs } from '@/lib/sanity';

// Same ISR window as the homepage: Studio edits go live within a minute.
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Frequently Asked Questions',
    description:
        'Answers to common questions about booking, preparing for, and enjoying a Holiday River Expeditions trip.',
};

// Display order and labels for FAQ categories (schema values in faq.ts).
const categoryLabels: Array<{ value: string; label: string }> = [
    { value: 'general', label: 'General' },
    { value: 'booking', label: 'Booking' },
    { value: 'trip-preparation', label: 'Trip Preparation' },
    { value: 'safety', label: 'Safety' },
    { value: 'cancellation', label: 'Cancellation' },
];

export default async function FaqPage() {
    const faqs = await getAllFaqs();

    const groups = categoryLabels
        .map((cat) => ({
            ...cat,
            faqs: faqs.filter((faq) => faq.category === cat.value),
        }))
        .filter((group) => group.faqs.length > 0);

    return (
        <>
            <Section background='white' className='pb-4 pt-14 md:pt-20'>
                <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    Frequently Asked Questions
                </h1>
            </Section>

            <Section background='white' className='pb-20 pt-4 md:pb-24'>
                {groups.length === 0 ? (
                    <p className='text-body leading-body text-onyx/60'>
                        FAQs coming soon — add them in the Studio.
                    </p>
                ) : (
                    <div className='max-w-3xl space-y-12'>
                        {groups.map((group) => (
                            <div key={group.value}>
                                <h2 className='font-alt-gothic text-[36px] font-black uppercase leading-[0.9] text-onyx'>
                                    {group.label}
                                </h2>
                                <div className='mt-6 divide-y divide-holiday-grey/40 border-y border-holiday-grey/40'>
                                    {group.faqs.map((faq) => (
                                        <details
                                            key={faq._id}
                                            className='group py-4'
                                        >
                                            <summary className='flex cursor-pointer list-none items-center justify-between gap-4 font-alt-gothic text-h3 font-semibold uppercase leading-h3 text-onyx transition-opacity hover:opacity-70 [&::-webkit-details-marker]:hidden'>
                                                {faq.question}
                                                <span
                                                    aria-hidden
                                                    className='text-holiday-red transition-transform group-open:rotate-45'
                                                >
                                                    +
                                                </span>
                                            </summary>
                                            {faq.answer && (
                                                <div className='mt-3 space-y-3 text-body leading-body text-onyx [&_a]:text-holiday-red [&_a]:underline'>
                                                    <PortableText
                                                        value={faq.answer}
                                                    />
                                                </div>
                                            )}
                                        </details>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </>
    );
}
