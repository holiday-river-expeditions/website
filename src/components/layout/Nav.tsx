import Link from 'next/link';

const navItems = [
    { label: 'Rafting', href: '/rafting' },
    { label: 'Biking', href: '/biking' },
    { label: 'Specialty', href: '/specialty' },
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
] as const;

export { navItems };

export function DesktopNav() {
    return (
        // Six labels at gap-8 need ~486px, more than the header's left
        // column has at 1024px, so "About Us" broke onto two lines. A
        // tighter gap until xl and nowrap labels keep it on one line.
        <nav className='hidden items-center gap-5 lg:flex xl:gap-8'>
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className='whitespace-nowrap font-alt-gothic text-[20px] font-medium uppercase leading-none text-holiday-red transition-opacity hover:opacity-70'
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
