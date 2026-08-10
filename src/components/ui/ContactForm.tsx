'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const inputStyles =
    'w-full border border-onyx/30 bg-holiday-white px-4 py-3 text-body text-onyx placeholder:text-holiday-grey focus:border-holiday-red focus:outline-none';

export function ContactForm() {
    const [status, setStatus] = useState<FormStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);

        setStatus('submitting');
        setError(null);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.get('name'),
                    email: data.get('email'),
                    message: data.get('message'),
                }),
            });
            if (!res.ok) {
                const body = (await res.json()) as { error?: string };
                throw new Error(body.error ?? 'Something went wrong.');
            }
            form.reset();
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(
                err instanceof Error ? err.message : 'Something went wrong.',
            );
        }
    }

    if (status === 'success') {
        return (
            <div className='border-l-2 border-holiday-red pl-4'>
                <p className='text-paragraph font-bold leading-paragraph text-onyx'>
                    Thanks for reaching out!
                </p>
                <p className='mt-2 text-body leading-body text-onyx'>
                    We&rsquo;ve got your message and will get back to you soon.
                    Need an answer today? Call us at 801-266-2087.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <label className='flex flex-col gap-1'>
                <span className='font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-onyx'>
                    Name
                </span>
                <input
                    name='name'
                    type='text'
                    required
                    maxLength={200}
                    autoComplete='name'
                    className={inputStyles}
                />
            </label>
            <label className='flex flex-col gap-1'>
                <span className='font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-onyx'>
                    Email
                </span>
                <input
                    name='email'
                    type='email'
                    required
                    maxLength={320}
                    autoComplete='email'
                    className={inputStyles}
                />
            </label>
            <label className='flex flex-col gap-1'>
                <span className='font-alt-gothic text-[12px] font-medium uppercase tracking-[0.05em] text-onyx'>
                    Message
                </span>
                <textarea
                    name='message'
                    required
                    maxLength={5000}
                    rows={6}
                    className={inputStyles}
                />
            </label>
            {status === 'error' && error && (
                <p role='alert' className='text-body text-holiday-red'>
                    {error}
                </p>
            )}
            <div>
                <Button
                    type='submit'
                    size='lg'
                    disabled={status === 'submitting'}
                >
                    {status === 'submitting' ? 'Sending…' : 'Send Message'}
                </Button>
            </div>
        </form>
    );
}
