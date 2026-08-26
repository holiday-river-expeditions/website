'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    DEMO_STORAGE_KEY,
    DEMO_UPDATED_EVENT,
    parseDemoState,
} from '@/lib/demo-flags';

/** Arms the demo overlay for this browser and redirects home. Existing
    flag choices are preserved so re-visiting /admin is idempotent. */
export function ArmDemo() {
    const router = useRouter();

    useEffect(() => {
        const state = parseDemoState(localStorage.getItem(DEMO_STORAGE_KEY));
        localStorage.setItem(
            DEMO_STORAGE_KEY,
            JSON.stringify({ ...state, armed: true }),
        );
        window.dispatchEvent(new CustomEvent(DEMO_UPDATED_EVENT));
        router.replace('/');
    }, [router]);

    return <p className='text-body text-onyx/70'>Arming the demo panel…</p>;
}
