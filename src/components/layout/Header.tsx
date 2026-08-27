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
            <div className='flex items-center justify-between gap-2 px-4 py-5 sm:px-6 md:px-12 lg:grid lg:grid-cols-[1fr_auto_1fr]'>
                {/* Left: desktop nav */}
                <div className='hidden lg:block lg:justify-self-start'>
                    <DesktopNav />
                </div>

                {/* Center: icon logo. shrink-0 because the lockup's mark is an
                    auto-width <Image> that contributes 0 to min-content — without
                    it the link compresses and the nowrap wordmark spills out from
                    under it, back into the hamburger. */}
                <Link
                    href='/'
                    className='shrink-0 justify-self-center'
                    aria-label='Holiday River Expeditions home'
                >
                    <Logo size='text-[26px] sm:text-[32px] md:text-[48px]' />
                </Link>

                {/* Right: hamburger + cart + BOOK NOW. shrink-0 keeps the
                    cluster at its intrinsic width — squeezed, justify-end
                    would overflow it leftward on top of the logo. */}
                <div className='flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 md:gap-3'>
                    <MobileNav />
                    <MiniCart />
                    <Button href='/book' size='compact'>
                        Book Now
                    </Button>
                </div>
            </div>
        </header>
    );
}
