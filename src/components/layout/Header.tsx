import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { MiniCart } from '@/components/ui/MiniCart';
import { HeaderHeight } from './HeaderHeight';
import { DesktopNav } from './Nav';
import { MobileNav } from './MobileNav';

export function Header() {
    return (
        // Sticky for everyone since 2026-11-06 (was the sticky-header
        // flag): persistent nav + logo while scrolling, for wayfinding on
        // long pages. z-50 sits above content and the trip bar (z-40),
        // below the demo panel (z-[100]).
        //
        // Below md it condenses once the page scrolls (HeaderHeight sets
        // data-header-condensed): 86px tall with a 46px logo on arrival,
        // 56px with a 32px logo while reading. The 30px bottom margin it
        // gains while condensed equals the height it loses, and the row,
        // logo and margin share one duration and easing, so the page below
        // never moves (no layout shift). Content slides under the header.
        <header
            data-site-header
            className='sticky top-0 z-50 bg-holiday-white shadow-md transition-[margin] duration-200 ease-out motion-reduce:transition-none max-md:[[data-header-condensed]_&]:mb-[30px]'
        >
            <HeaderHeight />
            {/* Full-bleed: nav hugs the left edge, hamburger/Book Now the right
                (mock places them ~48px from the viewport edges, no max-width).
                lg:gap-4 keeps the nav off the logo at 1024px, where the nav
                fills its column. */}
            <div className='flex items-center justify-between gap-2 px-4 py-5 transition-[height,padding] duration-200 ease-out motion-reduce:transition-none max-md:h-[86px] sm:px-6 md:px-12 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4 max-md:[[data-header-condensed]_&]:h-14 max-md:[[data-header-condensed]_&]:py-2'>
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
                    <Logo
                        size='text-[46px] md:text-[48px] max-md:[[data-header-condensed]_&]:text-[32px]'
                        className='transition-[font-size] duration-200 ease-out motion-reduce:transition-none'
                    />
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
