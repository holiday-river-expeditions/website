import { useSyncExternalStore } from 'react';
import {
    DEMO_UPDATED_EVENT,
    demoAttribute,
    type DemoFlagId,
} from './demo-flags';

/**
 * Live read of a per-browser demo flag from a client component. The
 * source of truth is the data-demo-* attribute on <html> — stamped
 * before paint by the layout's init script and flipped live by the
 * DemoFlagsPanel, which dispatches DEMO_UPDATED_EVENT after every
 * change. Server snapshot is false: real visitors get defaults.
 */
export function useDemoFlag(id: DemoFlagId): boolean {
    return useSyncExternalStore(
        (callback) => {
            window.addEventListener(DEMO_UPDATED_EVENT, callback);
            return () =>
                window.removeEventListener(DEMO_UPDATED_EVENT, callback);
        },
        () => document.documentElement.hasAttribute(demoAttribute(id)),
        () => false,
    );
}
