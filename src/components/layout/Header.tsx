import Image from 'next/image';
import Link from 'next/link';
import { DesktopNav } from './Nav';
import { MobileNav } from './MobileNav';

export function Header() {
    return (
        <header className='relative bg-charcoal'>
            <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
                <Link href='/' className='flex-shrink-0'>
                    <Image
                        src='/logo.svg'
                        alt='Holiday River Expeditions'
                        width={120}
                        height={191}
                        className='h-12 w-auto'
                        priority
                    />
                </Link>
                <DesktopNav />
                <MobileNav />
            </div>
        </header>
    );
}
