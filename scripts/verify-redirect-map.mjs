#!/usr/bin/env node
/**
 * Checks docs/project/redirect-map.md against a live site.
 *
 *   --targets <base>  Pre-cutover. Requests every non-pattern target on <base>
 *                     (the new site) and reports `ready` rows that are not 200
 *                     and `pending` rows that now are.
 *   --source <base>   Post-cutover. Requests every old path on <base> (the old
 *                     site) without following redirects and checks for exactly
 *                     one 301/308 whose Location matches the mapped target.
 *                     Reports 404s, wrong targets, and chains.
 *   --new <base>      With --source: the new site origin the Location header
 *                     should point at. Default https://holidayriver.com
 *   --concurrency N   Default 8.
 *
 * Exit code 1 when any FAIL is reported. No dependencies; Node 18+.
 *
 * Run from the workspace root:
 *   node website/scripts/verify-redirect-map.mjs docs/project/redirect-map.md --targets https://website-phi-six-25.vercel.app
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const mapPath = args.find((a) => !a.startsWith('--'));
const opt = (name, fallback) => {
    const i = args.indexOf(name);
    return i === -1 ? fallback : args[i + 1];
};
const targetsBase = opt('--targets');
const sourceBase = opt('--source');
const newBase = opt('--new', 'https://holidayriver.com');
const concurrency = Number(opt('--concurrency', '8'));

if (!mapPath || (!targetsBase && !sourceBase)) {
    console.error(
        'usage: verify-redirect-map.mjs <map.md> (--targets <base> | --source <base> [--new <base>])',
    );
    process.exit(2);
}

// --- Parse every markdown table whose first cell is a backticked old path ---
const rows = [];
for (const line of readFileSync(mapPath, 'utf8').split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line
        .slice(1, line.endsWith('|') ? -1 : undefined)
        .split('|')
        .map((c) => c.trim());
    if (cells.length < 4) continue;
    const m = cells[0].match(/^`([^`]+)`$/);
    if (!m) continue; // header, separator, or the legend table
    const oldPath = m[1];
    const target = (cells[1].match(/^`([^`]+)`$/) ?? [])[1];
    if (!target) continue;
    rows.push({
        oldPath,
        target,
        kind: cells[2],
        status: cells[3],
        note: cells[4] ?? '',
    });
}

const isPattern = (p) => p.includes('*');
const stripAnchor = (p) => p.replace(/#.*$/, '');
const normalise = (p) => stripAnchor(p).replace(/\/$/, '') || '/';

async function head(url, redirect) {
    try {
        let res = await fetch(url, { method: 'HEAD', redirect });
        if (res.status === 405)
            res = await fetch(url, { method: 'GET', redirect });
        return res;
    } catch (err) {
        return { status: 0, headers: new Headers(), error: err.message };
    }
}

async function mapLimit(items, limit, fn) {
    const out = [];
    let i = 0;
    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (i < items.length) {
                const idx = i++;
                out[idx] = await fn(items[idx]);
            }
        }),
    );
    return out;
}

const findings = [];
const report = (level, row, msg) => findings.push({ level, row, msg });

if (targetsBase) {
    const base = targetsBase.replace(/\/$/, '');
    const seen = new Map();
    const unique = [
        ...new Set(
            rows
                .filter((r) => r.kind !== 'drop')
                .map((r) => normalise(r.target)),
        ),
    ];
    await mapLimit(unique, concurrency, async (path) => {
        const res = await head(base + path, 'follow');
        seen.set(path, res.status);
    });
    for (const row of rows) {
        if (row.kind === 'drop') continue;
        const status = seen.get(normalise(row.target));
        if (row.status === 'ready' && status !== 200) {
            report(
                'FAIL',
                row,
                `target ${row.target} returned ${status} on ${base}`,
            );
        } else if (row.status === 'pending' && status === 200) {
            report(
                'INFO',
                row,
                `target ${row.target} is live now; flip status to ready`,
            );
        } else if (row.status === 'decision' && status !== 200) {
            report(
                'NOTE',
                row,
                `proposed target ${row.target} returned ${status}`,
            );
        }
    }
}

if (sourceBase) {
    const base = sourceBase.replace(/\/$/, '');
    const checkable = rows.filter(
        (r) => !isPattern(r.oldPath) && r.kind !== 'drop',
    );
    await mapLimit(checkable, concurrency, async (row) => {
        const expected = newBase.replace(/\/$/, '') + row.target;
        let url = base + row.oldPath;
        const hops = [];
        for (let i = 0; i < 6; i++) {
            const res = await head(url, 'manual');
            const loc = res.headers.get('location');
            hops.push({ url, status: res.status, loc });
            if (![301, 302, 307, 308].includes(res.status) || !loc) break;
            url = new URL(loc, url).href;
        }
        const first = hops[0];
        if (first.status === 0)
            return report('FAIL', row, `request failed: ${first.error}`);
        if (![301, 308].includes(first.status)) {
            return report('FAIL', row, `expected 301, got ${first.status}`);
        }
        const landed = new URL(first.loc, first.url).href;
        if (normalise(landed) !== normalise(expected)) {
            report('FAIL', row, `301 to ${landed}, expected ${expected}`);
        }
        if (
            hops.length > 2 ||
            (hops.length === 2 && [301, 302, 307, 308].includes(hops[1].status))
        ) {
            report(
                'WARN',
                row,
                `chain: ${hops.map((h) => `${h.status} ${h.url}`).join(' -> ')}`,
            );
        }
    });
}

const order = { FAIL: 0, WARN: 1, INFO: 2, NOTE: 3 };
findings.sort((a, b) => order[a.level] - order[b.level]);
for (const f of findings)
    console.log(`${f.level.padEnd(4)} ${f.row.oldPath}  ${f.msg}`);

const counts = findings.reduce(
    (acc, f) => ((acc[f.level] = (acc[f.level] ?? 0) + 1), acc),
    {},
);
console.log(
    `\n${rows.length} rows checked. ` +
        Object.entries(counts)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ') || 'clean',
);
process.exit(counts.FAIL ? 1 : 0);
