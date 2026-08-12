'use client';

import { useState } from 'react';

type SignupStatus = 'idle' | 'submitting' | 'success' | 'error';

export function NewsletterSignup() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<SignupStatus>('idle');

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatus('submitting');
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error('Signup failed');
            setEmail('');
            setStatus('success');
        } catch {
            setStatus('error');
        }
    }

    return (
        <div className='max-w-md'>
            <h2 className='font-alt-gothic text-section font-medium uppercase text-holiday-red'>
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
                        className='w-full rounded-full border border-onyx/30 bg-holiday-white px-5 py-3 pr-14 text-body text-onyx placeholder:text-holiday-grey focus:border-holiday-red'
                    />
                    <button
                        type='submit'
                        aria-label='Subscribe'
                        disabled={status === 'submitting'}
                        className='absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-holiday-red text-holiday-white transition-opacity hover:opacity-90 disabled:opacity-50'
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

            <div aria-live='polite'>
                {status === 'success' && (
                    <p className='mt-3 text-body font-bold leading-body text-holiday-red'>
                        You&rsquo;re on the list. See you on the river!
                    </p>
                )}
                {status === 'error' && (
                    <p className='mt-3 text-body text-holiday-red'>
                        Something went wrong. Please try again.
                    </p>
                )}
            </div>

            <p className='mt-4 text-body font-bold leading-body text-onyx'>
                Stay in the loop
            </p>
            <p className='mt-2 text-body leading-body text-onyx/80'>
                Trip dates, river updates, specials, and the occasional story
                from the canyon.
            </p>
        </div>
    );
}
