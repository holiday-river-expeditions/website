import Image from 'next/image';
import Link from 'next/link';
import { NewsletterSignup } from '@/components/ui/NewsletterSignup';
import { getSiteSettings } from '@/lib/sanity';

// Fallbacks if the Site Settings singleton hasn't been seeded/edited yet.
const defaults = {
    phone: '801-266-2087',
    address: '544 East 3900 South\nSalt Lake City, Utah 84107',
    socialLinks: {
        instagram: 'https://www.instagram.com/holidayriverexpeditions',
        facebook: 'https://www.facebook.com/HolidayRiverExpeditions',
        youtube: 'https://www.youtube.com/@holidayriverexpeditions',
    },
};

const resourceLinks = [
    { label: 'Trip Dates', href: '/open-seats' },
    { label: 'F.A.Q.', href: '/faq' },
    { label: 'Trip Insurance', href: '/trip-insurance' },
    {
        label: 'Online Store',
        href: 'https://holiday-river-expeditions.square.site/',
        external: true,
    },
] as const;

export async function Footer() {
    const settings = await getSiteSettings();
    const phone = settings?.phone ?? defaults.phone;
    const address = settings?.address ?? defaults.address;
    const social = { ...defaults.socialLinks, ...settings?.socialLinks };
    const followLinks = [
        { label: 'Instagram', href: social.instagram },
        { label: 'Facebook', href: social.facebook },
        { label: 'YouTube', href: social.youtube },
        ...(social.tiktok ? [{ label: 'TikTok', href: social.tiktok }] : []),
    ].filter((link) => Boolean(link.href));

    return (
        <footer className='bg-[#F3F0EB] text-onyx'>
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
                            external: 'external' in link && link.external,
                        }))}
                    />

                    {/* Find Us */}
                    <div>
                        <h3 className='font-alt-gothic text-body font-normal uppercase tracking-[0.05em] text-onyx'>
                            Find Us
                        </h3>
                        <div className='mt-4 flex flex-col gap-2 font-alt-gothic text-body font-semibold uppercase tracking-[0.05em] text-onyx'>
                            <Link
                                href='/contact'
                                className='transition-opacity hover:opacity-70'
                            >
                                Contact
                            </Link>
                            <address className='whitespace-pre-line not-italic text-[11px] tracking-wider'>
                                {address}
                            </address>
                            <a
                                href={`tel:+1${phone.replace(/\D/g, '')}`}
                                className='text-[11px] tracking-wider transition-opacity hover:opacity-70'
                            >
                                {phone}
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

                    <Image
                        src='/nps-authorized-concessioner.png'
                        alt='National Park Service Authorized Concessioner'
                        width={120}
                        height={150}
                        className='h-16 w-auto md:h-20'
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
            <h3 className='font-alt-gothic text-body font-normal uppercase tracking-[0.05em] text-onyx'>
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
                                className='font-alt-gothic text-body font-semibold uppercase tracking-[0.05em] text-onyx transition-opacity hover:opacity-70'
                            >
                                {item.label}
                            </a>
                        ) : (
                            <Link
                                href={item.href}
                                className='font-alt-gothic text-body font-semibold uppercase tracking-[0.05em] text-onyx transition-opacity hover:opacity-70'
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
