'use client';

import Link from 'next/link';
import { useState } from 'react';
import { navItems } from './Nav';

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="lg:hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                className="flex h-10 w-10 items-center justify-center text-white"
            >
                {isOpen ? (
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full z-50 border-t border-white/10 bg-charcoal">
                    <nav className="flex flex-col px-6 py-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="border-b border-white/10 py-3 text-body font-semibold text-white transition-colors hover:text-brand-red"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href="/open-seats"
                            onClick={() => setIsOpen(false)}
                            className="mt-4 rounded-lg bg-brand-red px-5 py-3 text-center text-body font-semibold text-white transition-colors hover:bg-brand-red/90"
                        >
                            Open Seats
                        </Link>
                    </nav>
                </div>
            )}
        </div>
    );
}
