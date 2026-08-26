import type { Metadata } from 'next';
import { ArmDemo } from './ArmDemo';

/**
 * Arming route for the per-browser demo-flags overlay. Visiting this page
 * marks the current browser as armed (localStorage) and bounces home,
 * where the floating DemoFlagsPanel appears. Unauthenticated by design:
 * flags only ever affect the visitor's own browser, never other visitors.
 */

export const metadata: Metadata = {
    title: 'Demo Admin',
    robots: { index: false, follow: false },
};

export default function AdminPage() {
    return (
        <div className='px-6 py-24 text-center'>
            <ArmDemo />
        </div>
    );
}
