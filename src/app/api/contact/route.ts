import { NextResponse } from 'next/server';
import { z } from 'zod';
import { writeClient } from '@/lib/sanity/client';

/**
 * Contact form capture. Submissions become `contactSubmission` documents in
 * Sanity, triaged in /studio — an interim store until an email/CRM provider
 * is chosen (see docs/project/open-decisions.md).
 */

const contactSchema = z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    message: z.string().trim().min(1).max(5000),
});

export async function POST(req: Request) {
    let json: unknown;
    try {
        json = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Please provide a name, a valid email, and a message.' },
            { status: 400 },
        );
    }

    try {
        await writeClient.create({
            _type: 'contactSubmission',
            ...parsed.data,
            submittedAt: new Date().toISOString(),
        });
    } catch {
        return NextResponse.json(
            { error: 'Something went wrong. Please call us instead.' },
            { status: 500 },
        );
    }

    return NextResponse.json({ ok: true });
}
