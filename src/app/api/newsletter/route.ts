import { NextResponse } from 'next/server';
import { z } from 'zod';
import { writeClient } from '@/lib/sanity/client';

/**
 * Newsletter signup capture. Signups become `newsletterSubscriber` documents
 * in Sanity — an interim store until an email provider is chosen (see
 * docs/project/open-decisions.md). Idempotent per email: the doc _id derives
 * from the address, so re-subscribing never creates duplicates.
 */

const signupSchema = z.object({
    email: z.string().trim().email().max(320),
});

export async function POST(req: Request) {
    let json: unknown;
    try {
        json = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Please provide a valid email address.' },
            { status: 400 },
        );
    }

    const email = parsed.data.email.toLowerCase();
    // Sanity _ids allow letters, digits, dots, dashes, underscores — encode
    // anything else so any valid email maps to a stable, legal id.
    const id = `newsletterSubscriber-${email.replace(/[^a-z0-9._-]/g, (c) => `_${c.charCodeAt(0)}_`)}`;

    try {
        await writeClient.createOrReplace({
            _id: id,
            _type: 'newsletterSubscriber',
            email,
            subscribedAt: new Date().toISOString(),
        });
    } catch {
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 },
        );
    }

    return NextResponse.json({ ok: true });
}
