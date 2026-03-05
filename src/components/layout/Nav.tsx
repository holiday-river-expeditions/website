import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const navItems = [
    { label: 'Trips', href: '/trips' },
    { label: 'Destinations', href: '/destinations' },
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
] as const;

export { navItems };

export function DesktopNav() {
    return (
        <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="text-body font-semibold text-white transition-colors hover:text-brand-red"
                >
                    {item.label}
                </Link>
            ))}
            <Button href="/open-seats">Open Seats</Button>
        </nav>
    );
}
