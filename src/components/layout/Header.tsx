import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { MiniCart } from '@/components/ui/MiniCart';
import { DesktopNav } from './Nav';
import { MobileNav } from './MobileNav';

export function Header() {
    return (
        <header className='relative bg-holiday-white'>
            {/* Full-bleed: nav hugs the left edge, hamburger/Book Now the right
                (mock places them ~48px from the viewport edges, no max-width). */}
            <div className='grid grid-cols-[1fr_auto_1fr] items-center px-6 py-5 md:px-12'>
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
                    <Logo size='text-[26px] md:text-[32px]' />
                </Link>

                {/* Right: hamburger + cart + BOOK NOW */}
                <div className='flex items-center justify-end gap-3'>
                    <MobileNav />
                    <MiniCart />
                    <Button href='/book' size='default'>
                        Book Now
                    </Button>
                </div>
            </div>
        </header>
    );
}
