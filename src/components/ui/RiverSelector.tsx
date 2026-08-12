'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export interface River {
    name: string;
    href: string;
    image: string;
}

interface RiverSelectorProps {
    rivers: River[];
}

export function RiverSelector({ rivers }: RiverSelectorProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeRiver = rivers[activeIndex] ?? rivers[0];

    return (
        <section className='relative min-h-[600px] overflow-hidden bg-evergreen md:min-h-[720px]'>
            {/* Background images — all rendered for smooth crossfade.
                next/image (not CSS backgrounds) so each device gets a
                properly-sized, DPR-aware file instead of upscaling one small
                crop into a grainy full-bleed. Hidden layers still load once
                the section is in view, keeping the crossfade instant. */}
            {rivers.map(
                (river, index) =>
                    river.image && (
                        <Image
                            key={river.name}
                            src={river.image}
                            alt=''
                            aria-hidden='true'
                            fill
                            sizes='100vw'
                            className={`object-cover transition-opacity duration-500 ${
                                index === activeIndex
                                    ? 'opacity-100'
                                    : 'opacity-0'
                            }`}
                        />
                    ),
            )}

            {/* Dark overlay for legibility */}
            <div className='absolute inset-0 bg-onyx/30' />

            {/* River name list */}
            <div className='relative z-10 flex min-h-[600px] items-center justify-center py-20 md:min-h-[720px]'>
                <ul className='flex flex-col items-center gap-1'>
                    {rivers.map((river, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <li key={river.name}>
                                <Link
                                    href={river.href}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onFocus={() => setActiveIndex(index)}
                                    className={`block font-alt-gothic text-[40px] font-black uppercase leading-[0.9] tracking-tight transition-colors md:text-[56px] ${
                                        isActive
                                            ? 'text-holiday-red'
                                            : 'text-holiday-white hover:text-holiday-red'
                                    }`}
                                >
                                    {river.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Screen-reader hint for the currently shown image */}
            <span className='sr-only'>
                Background image: {activeRiver?.name}
            </span>
        </section>
    );
}
