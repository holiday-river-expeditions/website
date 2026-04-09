import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { DesktopNav } from './Nav';
import { MobileNav } from './MobileNav';

export function Header() {
    return (
        <header className='relative bg-holiday-white'>
            <div className='mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-6 py-5'>
                {/* Left: desktop nav */}
                <div className='justify-self-start'>
                    <DesktopNav />
                </div>

                {/* Center: icon logo */}
                <Link
                    href='/'
                    className='justify-self-center'
                    aria-label='Holiday River Expeditions home'
                >
                    <Image
                        src='/icon-red.svg'
                        alt='Holiday River Expeditions'
                        width={56}
                        height={56}
                        className='h-10 w-auto md:h-12'
                        priority
                    />
                </Link>

                {/* Right: hamburger + BOOK NOW */}
                <div className='flex items-center justify-end gap-3'>
                    <MobileNav />
                    <Button href='/book' size='default'>
                        Book Now
                    </Button>
                </div>
            </div>
        </header>
    );
}
