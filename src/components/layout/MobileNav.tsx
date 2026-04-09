'use client';

import Link from 'next/link';
import { useState } from 'react';
import { navItems } from './Nav';

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type='button'
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                className='flex h-10 w-10 items-center justify-center text-holiday-red'
            >
                {isOpen ? (
                    <svg
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <line x1='18' y1='6' x2='6' y2='18' />
                        <line x1='6' y1='6' x2='18' y2='18' />
                    </svg>
                ) : (
                    <svg
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <line x1='3' y1='6' x2='21' y2='6' />
                        <line x1='3' y1='12' x2='21' y2='12' />
                        <line x1='3' y1='18' x2='21' y2='18' />
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className='absolute left-0 right-0 top-full z-50 border-t border-holiday-grey/30 bg-holiday-white lg:hidden'>
                    <nav className='flex flex-col px-6 py-4'>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className='border-b border-holiday-grey/30 py-3 font-alt-gothic text-body font-medium uppercase tracking-widest text-holiday-red'
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </>
    );
}
