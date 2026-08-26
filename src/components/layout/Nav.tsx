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
        <nav className='hidden items-center gap-8 lg:flex'>
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className='font-alt-gothic text-[20px] font-medium uppercase leading-none text-holiday-red transition-opacity hover:opacity-70'
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
