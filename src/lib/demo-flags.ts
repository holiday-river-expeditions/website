import { z } from 'zod';

/**
 * Per-browser demo flags. Flags live in the visitor's own localStorage —
 * production always serves the approved defaults, and only a browser that
 * has been armed (by visiting /admin) sees demo variants via the floating
 * DemoFlagsPanel. Nothing here touches the server or the ISR cache: the
 * layout inlines DEMO_INIT_SCRIPT to stamp data-demo-* attributes on
 * <html> before first paint, and components render both variants with CSS
 * choosing one per attribute.
 *
 * Conventions: every flag defaults to OFF, and OFF must equal current
 * production behavior — a missing key, garbage JSON, or a wrong shape all
 * collapse to the approved experience. Adding a flag means adding one
 * entry to DEMO_FLAGS and gating the variant markup on demoAttribute(id).
 */

export const DEMO_STORAGE_KEY = 'hre_demo';
export const DEMO_UPDATED_EVENT = 'hre:demo-updated';

export const DEMO_FLAGS = [
    {
        id: 'finder-logic',
        label: 'Trip finder logic panel',
        description:
            'ON: an explainer under the wizard and its results showing where the questions came from, what the visitor has answered, how every trip scored and why, and which trips are missing facts.',
    },
] as const satisfies readonly {
    id: string;
    label: string;
    description: string;
    /** Mutually exclusive flags share a group and render as radios. */
    group?: string;
}[];

export type DemoFlagId = (typeof DEMO_FLAGS)[number]['id'];

/** Radio-group metadata for mutually exclusive flag sets. */
export const DEMO_FLAG_GROUPS: Record<
    string,
    { label: string; defaultLabel: string }
> = {};

const FLAG_IDS: readonly string[] = DEMO_FLAGS.map((flag) => flag.id);

const demoStateSchema = z.object({
    armed: z.boolean(),
    // Any string key, then filtered to the live registry. A browser armed
    // before a flag was retired (most of them graduated on 2026-11-06)
    // still has that key stored, and rejecting it would quietly disarm the
    // whole browser.
    flags: z
        .record(z.string(), z.boolean())
        .transform(
            (flags) =>
                Object.fromEntries(
                    Object.entries(flags).filter(([id]) =>
                        FLAG_IDS.includes(id),
                    ),
                ) as Partial<Record<DemoFlagId, boolean>>,
        ),
});

export type DemoState = z.infer<typeof demoStateSchema>;

export const DISARMED: DemoState = { armed: false, flags: {} };

/** localStorage is an untrusted boundary: anything unparseable or
    mis-shaped falls back to the disarmed default. Retired flag keys are
    dropped rather than rejected. */
export function parseDemoState(raw: string | null): DemoState {
    if (!raw) return DISARMED;
    try {
        return demoStateSchema.parse(JSON.parse(raw));
    } catch {
        return DISARMED;
    }
}

export function demoAttribute(id: DemoFlagId): `data-demo-${DemoFlagId}` {
    return `data-demo-${id}`;
}

/**
 * Blocking no-flash script inlined into the root layout's <head>. Runs
 * before first paint so an armed browser never flashes the default
 * variant. Generated from DEMO_FLAGS so the registry stays the single
 * source of truth. Dependency-free, try/catch-wrapped, and strict about
 * `=== true` so malformed storage renders the defaults.
 *
 * If a Content-Security-Policy is ever added to this site, this inline
 * script will need a hash or nonce.
 */
export const DEMO_INIT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
    DEMO_STORAGE_KEY,
)})||'null');if(s&&s.flags){${JSON.stringify(
    DEMO_FLAGS.map((flag) => flag.id),
)}.forEach(function(id){if(s.flags[id]===true)document.documentElement.setAttribute('data-demo-'+id,'on')})}}catch(e){}`;
