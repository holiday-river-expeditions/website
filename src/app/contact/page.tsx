import type { Metadata } from 'next';
import { ContactForm } from '@/components/ui/ContactForm';
import { Section } from '@/components/ui/Section';

export const metadata: Metadata = {
    title: 'Contact Us',
    description:
        'Get in touch with Holiday River Expeditions: call, email, or send us a message.',
};

const locations = [
    {
        name: 'Salt Lake City Main Office',
        lines: ['544 East 3900 South', 'Salt Lake City, Utah 84107'],
        phones: [
            { label: '800-624-6323', href: 'tel:+18006246323' },
            { label: '801-266-2087', href: 'tel:+18012662087' },
        ],
        note: 'Open year-round, and the best place to reach us.',
    },
    {
        name: 'Green River Headquarters',
        lines: ['Green River, Utah'],
        phones: [{ label: '435-564-3273', href: 'tel:+14355643273' }],
        note: 'Trip headquarters, open May–September.',
    },
    {
        name: 'Vernal Headquarters',
        lines: ['Vernal, Utah'],
        phones: [{ label: '435-789-4586', href: 'tel:+14357894586' }],
        note: 'Trip headquarters, open May–September.',
    },
] as const;

export default function ContactPage() {
    return (
        <>
            <Section background='white' className='pb-4 pt-14 md:pt-20'>
                <h1 className='font-alt-gothic text-h2 font-black uppercase leading-h2 text-holiday-red md:text-h1 md:leading-h1'>
                    Contact Us
                </h1>
                <p className='mt-4 max-w-2xl text-paragraph leading-paragraph text-onyx'>
                    Questions about a trip, a date, or what to pack? Call us,
                    email{' '}
                    <a
                        href='mailto:Info@HolidayExpeditions.com'
                        className='text-holiday-red underline'
                    >
                        Info@HolidayExpeditions.com
                    </a>
                    , or send a message below.
                </p>
            </Section>

            <Section background='white' className='pb-20 pt-8 md:pb-24'>
                {/* Split panel: evergreen info card beside the form. */}
                <div className='grid overflow-hidden lg:grid-cols-[1fr_1.2fr]'>
                    <div className='bg-topo bg-evergreen p-8 md:p-10'>
                        <h2 className='font-alt-gothic text-[28px] font-black uppercase leading-[0.95] text-holiday-white'>
                            Find Us on
                            <br />
                            Dry Land
                        </h2>
                        <div className='mt-8 space-y-8'>
                            {locations.map((location) => (
                                <div key={location.name}>
                                    <h3 className='font-alt-gothic text-[17px] font-semibold uppercase tracking-[0.03em] text-opal'>
                                        {location.name}
                                    </h3>
                                    <address className='mt-1.5 not-italic text-body leading-body text-holiday-white/90'>
                                        {location.lines.map((line) => (
                                            <div key={line}>{line}</div>
                                        ))}
                                    </address>
                                    <div className='mt-1 flex gap-4'>
                                        {location.phones.map((phone) => (
                                            <a
                                                key={phone.href}
                                                href={phone.href}
                                                className='inline-block py-1 text-body font-bold text-holiday-white underline decoration-opal underline-offset-4 transition-opacity hover:opacity-80'
                                            >
                                                {phone.label}
                                            </a>
                                        ))}
                                    </div>
                                    <p className='mt-1 text-[13px] leading-snug text-holiday-white/70'>
                                        {location.note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='border border-holiday-grey/30 p-8 md:p-10'>
                        <h2 className='font-alt-gothic text-[28px] font-black uppercase leading-[0.95] text-holiday-red'>
                            Send Us a Message
                        </h2>
                        <div className='mt-6'>
                            <ContactForm />
                        </div>
                    </div>
                </div>
            </Section>
        </>
    );
}
