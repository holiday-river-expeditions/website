import { NextResponse } from 'next/server';
import { arcticGet } from '@/lib/arctic/client';
import { z } from 'zod';

/**
 * Ops diagnostic for the Arctic connection. Reports which ARCTIC_* vars are
 * present (booleans + lengths only — never values) and attempts a live
 * token exchange + trivial read. Gated behind SANITY_REVALIDATE_SECRET so
 * it exposes nothing publicly.
 */

export const dynamic = 'force-dynamic';

function envInfo(name: string) {
    const value = process.env[name];
    return { set: Boolean(value), length: value?.length ?? 0 };
}

export async function GET(req: Request) {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    const provided = req.headers.get('authorization')?.replace(/^Bearer /, '');
    if (!secret || provided !== secret) {
        return new NextResponse('Not found', { status: 404 });
    }

    const vars = {
        ARCTIC_API_BASE_URL: envInfo('ARCTIC_API_BASE_URL'),
        ARCTIC_CLIENT_ID: envInfo('ARCTIC_CLIENT_ID'),
        ARCTIC_CLIENT_SECRET: envInfo('ARCTIC_CLIENT_SECRET'),
        ARCTIC_USERNAME: envInfo('ARCTIC_USERNAME'),
        ARCTIC_PASSWORD: envInfo('ARCTIC_PASSWORD'),
        // Flag value is not secret; expose it verbatim so misconfigurations
        // (quotes, whitespace, wrong environment) are visible at a glance.
        BOOKING_NATIVE: {
            value: process.env.BOOKING_NATIVE ?? null,
            active: process.env.BOOKING_NATIVE === 'true',
        },
    };

    let probe: string;
    try {
        await arcticGet('triptype/37', z.object({ id: z.coerce.number() }));
        probe = 'ok';
    } catch (error) {
        probe = error instanceof Error ? error.message : 'unknown error';
    }

    return NextResponse.json({ vars, probe });
}
