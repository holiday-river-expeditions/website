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
        id: 'logo-bold',
        label: 'Bold live-text lockup',
        description: 'Stacked Alternate Gothic lockup from the August batch.',
        group: 'logo',
    },
    {
        id: 'logo-line',
        label: 'Single line',
        description: 'HOLIDAY RIVER EXPEDITIONS live text on one line.',
        group: 'logo',
    },
    {
        id: 'logo-secondary',
        label: 'Official secondary lockup',
        description:
            "The brand package's Secondary Horizontal — bigger mark, squarer.",
        group: 'logo',
    },
    {
        id: 'logo-fresh',
        label: 'Fresh hierarchy',
        description:
            'HOLIDAY dominant with RIVER EXPEDITIONS letterspaced beneath.',
        group: 'logo',
    },
    {
        id: 'logo-legacy',
        label: 'Legacy (old website)',
        description:
            'The pre-rebrand flag-and-waves lockup from bikeraft.com. Note: the 2026 brand guidelines say not to mix old logos — demo only.',
        group: 'logo',
    },
    {
        id: 'bars-on-scroll',
        label: 'Floating bars appear on scroll',
        description:
            'ON: the floating section/filter bars stay hidden until the page is scrolled. OFF (default): always visible.',
    },
    {
        id: 'sticky-header',
        label: 'Sticky header',
        description:
            'ON: the header (nav + logo) sticks to the top while scrolling — persistent wayfinding on long pages.',
    },
    {
        id: 'river-flow',
        label: 'Live river flow (CFS)',
        description:
            'ON: the CFS reading + 7-day sparkline on trip and river pages, from USGS gauges.',
    },
    {
        id: 'trips-map',
        label: 'Homepage trips map',
        description:
            'ON: the topographic trips-map prototype (USGS tiles, MapLibre) replaces the river carousel below the Dee story.',
    },
    {
        id: 'badge-live',
        label: 'Animated anniversary badge',
        description:
            'ON: the hero seal stamps into place on load — same artwork, one-time settle, motion-safe only.',
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
> = {
    logo: {
        label: 'Logo treatment',
        defaultLabel: 'Classic SVG lockup (default)',
    },
};

const demoStateSchema = z.object({
    armed: z.boolean(),
    flags: z.partialRecord(
        z.enum(DEMO_FLAGS.map((flag) => flag.id)),
        z.boolean(),
    ),
});

export type DemoState = z.infer<typeof demoStateSchema>;

export const DISARMED: DemoState = { armed: false, flags: {} };

/** localStorage is an untrusted boundary: anything unparseable or
    mis-shaped falls back to the disarmed default. */
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
