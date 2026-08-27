'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
    DEMO_FLAGS,
    DEMO_FLAG_GROUPS,
    DEMO_STORAGE_KEY,
    DEMO_UPDATED_EVENT,
    demoAttribute,
    parseDemoState,
    type DemoState,
} from '@/lib/demo-flags';

/**
 * Floating per-browser demo-flags overlay. Renders nothing until this
 * browser is armed (by visiting /admin — see src/app/admin). Toggling a
 * flag writes localStorage and flips the matching data-demo-* attribute
 * on <html> in place, so the page restyles live without a reload; the
 * inline script in the root layout restores the attributes before first
 * paint on subsequent loads.
 *
 * Store shape follows MiniCart: useSyncExternalStore over the raw
 * localStorage string, invalidated by the hre:demo-updated event
 * (same tab) and the native storage event (other tabs).
 */

/** `group` is optional in the registry literal, so narrow through `in`. */
function flagGroup(flag: (typeof DEMO_FLAGS)[number]): string | undefined {
    return 'group' in flag ? flag.group : undefined;
}

function subscribe(callback: () => void) {
    window.addEventListener(DEMO_UPDATED_EVENT, callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener(DEMO_UPDATED_EVENT, callback);
        window.removeEventListener('storage', callback);
    };
}

function readRawState(): string | null {
    return localStorage.getItem(DEMO_STORAGE_KEY);
}

function writeState(state: DemoState | null) {
    if (state) {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } else {
        localStorage.removeItem(DEMO_STORAGE_KEY);
    }
    for (const flag of DEMO_FLAGS) {
        if (state?.flags[flag.id] === true) {
            document.documentElement.setAttribute(demoAttribute(flag.id), 'on');
        } else {
            document.documentElement.removeAttribute(demoAttribute(flag.id));
        }
    }
    window.dispatchEvent(new CustomEvent(DEMO_UPDATED_EVENT));
}

export function DemoFlagsPanel() {
    const raw = useSyncExternalStore(subscribe, readRawState, () => null);
    const state = parseDemoState(raw);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!state.armed) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [state.armed]);

    if (!state.armed) return null;

    return (
        <div className='fixed bottom-4 right-4 z-[100]'>
            {open ? (
                <div className='max-h-[calc(100vh-4rem)] w-64 overflow-y-auto border border-holiday-grey/40 bg-holiday-white p-4 shadow-lg'>
                    <div className='flex items-center justify-between'>
                        <h2 className='font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.05em] text-onyx'>
                            Demo Flags
                        </h2>
                        <button
                            type='button'
                            aria-label='Collapse demo panel'
                            onClick={() => setOpen(false)}
                            className='p-1 text-[13px] leading-none text-onyx/70 transition-colors hover:text-holiday-red'
                        >
                            ✕
                        </button>
                    </div>
                    {/* Grouped flags are mutually exclusive treatments —
                        radios say so honestly (picking one clears the rest
                        of its group). Ungrouped flags stay checkboxes. */}
                    {Object.entries(DEMO_FLAG_GROUPS).map(([group, meta]) => {
                        const members = DEMO_FLAGS.filter(
                            (flag) => flagGroup(flag) === group,
                        );
                        const selected =
                            members.find(
                                (flag) => state.flags[flag.id] === true,
                            )?.id ?? '';
                        const choose = (id: string) =>
                            writeState({
                                ...state,
                                flags: {
                                    ...state.flags,
                                    ...Object.fromEntries(
                                        members.map((flag) => [
                                            flag.id,
                                            flag.id === id,
                                        ]),
                                    ),
                                },
                            });
                        return (
                            <fieldset key={group} className='mt-3'>
                                <legend className='font-alt-gothic text-[13px] font-semibold uppercase tracking-[0.05em] text-onyx/70'>
                                    {meta.label}
                                </legend>
                                <ul className='mt-2 space-y-2'>
                                    <li>
                                        <label className='flex cursor-pointer items-start gap-2'>
                                            <input
                                                type='radio'
                                                name={`demo-${group}`}
                                                checked={selected === ''}
                                                onChange={() => choose('')}
                                                className='mt-0.5 accent-holiday-red'
                                            />
                                            <span className='block text-[14px] leading-snug text-onyx'>
                                                {meta.defaultLabel}
                                            </span>
                                        </label>
                                    </li>
                                    {members.map((flag) => (
                                        <li key={flag.id}>
                                            <label className='flex cursor-pointer items-start gap-2'>
                                                <input
                                                    type='radio'
                                                    name={`demo-${group}`}
                                                    checked={
                                                        selected === flag.id
                                                    }
                                                    onChange={() =>
                                                        choose(flag.id)
                                                    }
                                                    className='mt-0.5 accent-holiday-red'
                                                />
                                                <span>
                                                    <span className='block text-[14px] leading-snug text-onyx'>
                                                        {flag.label}
                                                    </span>
                                                    <span className='block text-[12px] leading-snug text-onyx/70'>
                                                        {flag.description}
                                                    </span>
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </fieldset>
                        );
                    })}
                    <ul className='mt-3 space-y-3 border-t border-holiday-grey/30 pt-3'>
                        {DEMO_FLAGS.filter(
                            (flag) => flagGroup(flag) === undefined,
                        ).map((flag) => (
                            <li key={flag.id}>
                                <label className='flex cursor-pointer items-start gap-2'>
                                    <input
                                        type='checkbox'
                                        checked={state.flags[flag.id] === true}
                                        onChange={(e) =>
                                            writeState({
                                                ...state,
                                                flags: {
                                                    ...state.flags,
                                                    [flag.id]: e.target.checked,
                                                },
                                            })
                                        }
                                        className='mt-0.5 accent-holiday-red'
                                    />
                                    <span>
                                        <span className='block text-[14px] leading-snug text-onyx'>
                                            {flag.label}
                                        </span>
                                        <span className='block text-[12px] leading-snug text-onyx/70'>
                                            {flag.description}
                                        </span>
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    <div className='mt-4 flex gap-2'>
                        <button
                            type='button'
                            onClick={() =>
                                writeState({ armed: true, flags: {} })
                            }
                            className='flex-1 border border-holiday-grey/40 px-2 py-1 text-[12px] uppercase tracking-wider text-onyx transition-colors hover:text-holiday-red'
                        >
                            Reset all
                        </button>
                        <button
                            type='button'
                            onClick={() => writeState(null)}
                            className='flex-1 border border-holiday-grey/40 px-2 py-1 text-[12px] uppercase tracking-wider text-onyx transition-colors hover:text-holiday-red'
                        >
                            Disarm
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type='button'
                    aria-expanded={false}
                    aria-label='Open demo flags panel'
                    onClick={() => setOpen(true)}
                    className='rounded-full bg-holiday-red px-3.5 py-1.5 font-alt-gothic text-[12px] font-semibold uppercase tracking-[0.08em] text-holiday-white shadow-lg transition-opacity hover:opacity-80'
                >
                    Demo
                </button>
            )}
        </div>
    );
}
