import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { MiniCart } from '@/components/ui/MiniCart';
import { HeaderReveal } from './HeaderReveal';
import { DesktopNav } from './Nav';
import { MobileNav } from './MobileNav';

export function Header() {
    return (
        // sticky-header demo flag: persistent nav + logo while scrolling
        // (wayfinding on long pages). header-reveal demo flag: the same
        // sticky header, slid away while scrolling down (HeaderReveal sets
        // data-header-hidden). z-50 sits above content and the floating
        // bars (z-40), below the demo panel (z-[100]).
        <header
            data-site-header
            className='relative bg-holiday-white [[data-demo-sticky-header=on]_&]:sticky [[data-demo-sticky-header=on]_&]:top-0 [[data-demo-sticky-header=on]_&]:z-50 [[data-demo-sticky-header=on]_&]:shadow-md [[data-demo-header-reveal=on]_&]:sticky [[data-demo-header-reveal=on]_&]:top-0 [[data-demo-header-reveal=on]_&]:z-50 [[data-demo-header-reveal=on]_&]:shadow-md [[data-demo-header-reveal=on]_&]:transition-transform [[data-demo-header-reveal=on]_&]:duration-200 motion-reduce:transition-none [[data-header-hidden]_&]:-translate-y-full'
        >
            <HeaderReveal />
            {/* Full-bleed: nav hugs the left edge, hamburger/Book Now the right
                (mock places them ~48px from the viewport edges, no max-width).
                lg:gap-4 keeps the nav off the logo at 1024px, where the nav
                fills its column. */}
            <div className='flex items-center justify-between gap-2 px-4 py-5 sm:px-6 md:px-12 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4'>
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
