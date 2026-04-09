import Image from 'next/image';
import Link from 'next/link';
import { NewsletterSignup } from '@/components/ui/NewsletterSignup';

const followLinks = [
    {
        label: 'Instagram',
        href: 'https://www.instagram.com/holidayriverexpeditions',
    },
    {
        label: 'Facebook',
        href: 'https://www.facebook.com/HolidayRiverExpeditions',
    },
    {
        label: 'YouTube',
        href: 'https://www.youtube.com/@holidayriverexpeditions',
    },
] as const;

const resourceLinks = [
    { label: 'Trip Dates', href: '/trip-dates' },
    { label: 'F.A.Q.', href: '/faq' },
    { label: 'Trip Insurance', href: '/trip-insurance' },
    { label: 'Online Store', href: '/store' },
] as const;

export function Footer() {
    return (
        <footer className='bg-sand text-onyx'>
            <div className='mx-auto max-w-7xl px-6 py-16'>
                <div className='grid gap-12 lg:grid-cols-[1.2fr_repeat(3,1fr)]'>
                    {/* Left: newsletter */}
                    <NewsletterSignup />

                    {/* Follow Us */}
                    <FooterColumn
                        title='Follow Us'
                        items={followLinks.map((link) => ({
                            label: link.label,
                            href: link.href,
                            external: true,
                        }))}
                    />

                    {/* Resources */}
                    <FooterColumn
                        title='Resources'
                        items={resourceLinks.map((link) => ({
                            label: link.label,
                            href: link.href,
                        }))}
                    />

                    {/* Find Us */}
                    <div>
                        <h3 className='font-alt-gothic text-body font-medium uppercase tracking-widest text-onyx'>
                            Find Us
                        </h3>
                        <div className='mt-4 flex flex-col gap-2 font-alt-gothic text-body uppercase tracking-widest text-onyx'>
                            <Link
                                href='/contact'
                                className='transition-opacity hover:opacity-70'
                            >
                                Contact
                            </Link>
                            <address className='not-italic text-[11px] tracking-wider'>
                                544 East 3900 South
                                <br />
                                Salt Lake City, Utah 84107
                            </address>
                            <a
                                href='tel:+18012662087'
                                className='text-[11px] tracking-wider transition-opacity hover:opacity-70'
                            >
                                801-266-2087
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom row: logo + NPS badge */}
                <div className='mt-16 flex items-end justify-between gap-8'>
                    <Link href='/' aria-label='Holiday River Expeditions home'>
                        <Image
                            src='/logo-horizontal-red.svg'
                            alt='Holiday River Expeditions'
                            width={240}
                            height={96}
                            className='h-16 w-auto md:h-20'
                        />
                    </Link>

                    {/*
                        TODO: Add NPS "Authorized Concessioner" shield badge
                        once the asset is provided by the client.
                    */}
                    <div
                        aria-hidden='true'
                        className='h-16 w-16 rounded-full border border-onyx/20 md:h-20 md:w-20'
                    />
                </div>
            </div>
        </footer>
    );
}

interface FooterColumnProps {
    title: string;
    items: ReadonlyArray<{
        label: string;
        href: string;
        external?: boolean;
    }>;
}

function FooterColumn({ title, items }: FooterColumnProps) {
    return (
        <div>
            <h3 className='font-alt-gothic text-body font-medium uppercase tracking-widest text-onyx'>
                {title}
            </h3>
            <ul className='mt-4 flex flex-col gap-2'>
                {items.map((item) => (
                    <li key={item.href}>
                        {item.external ? (
                            <a
                                href={item.href}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='font-alt-gothic text-body uppercase tracking-widest text-onyx transition-opacity hover:opacity-70'
                            >
                                {item.label}
                            </a>
                        ) : (
                            <Link
                                href={item.href}
                                className='font-alt-gothic text-body uppercase tracking-widest text-onyx transition-opacity hover:opacity-70'
                            >
                                {item.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
