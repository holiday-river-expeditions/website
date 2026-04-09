'use client';

import { useState } from 'react';

export function NewsletterSignup() {
    const [email, setEmail] = useState('');

    // TODO: Wire to /api/newsletter endpoint in a follow-up task
    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        // Placeholder: submission is a no-op for now
        setEmail('');
    }

    return (
        <div className='max-w-md'>
            <h2 className='font-alt-gothic text-h2 font-medium uppercase leading-h2 text-holiday-red'>
                The River Is Calling.
                <br />
                It Told Us To Email You.
            </h2>

            <form onSubmit={handleSubmit} className='mt-6'>
                <div className='relative'>
                    <input
                        type='email'
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder='Enter Email'
                        aria-label='Email address'
                        className='w-full rounded-full border border-onyx/30 bg-holiday-white px-5 py-3 pr-14 text-body text-onyx placeholder:text-holiday-grey focus:border-holiday-red focus:outline-none'
                    />
                    <button
                        type='submit'
                        aria-label='Subscribe'
                        className='absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-holiday-red text-holiday-white transition-opacity hover:opacity-90'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        >
                            <line x1='5' y1='12' x2='19' y2='12' />
                            <polyline points='12 5 19 12 12 19' />
                        </svg>
                    </button>
                </div>
            </form>

            <p className='mt-4 font-alt-gothic text-body font-medium uppercase tracking-widest text-onyx'>
                Stay in the loop
            </p>
            <p className='mt-2 text-body leading-body text-onyx/80'>
                Trip dates, river updates, specials, and the occasional story
                from the canyon.
            </p>
        </div>
    );
}
