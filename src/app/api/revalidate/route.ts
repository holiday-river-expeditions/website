import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

/**
 * Sanity publish webhook → on-demand revalidation.
 *
 * Configured in sanity.io/manage with a shared secret
 * (SANITY_REVALIDATE_SECRET); parseBody verifies the request signature so
 * only Sanity can trigger a purge. On any publish we revalidate the whole
 * route tree — the site is small and publishes are infrequent, so full purge
 * beats maintaining a per-type path map. The 60s ISR window on pages remains
 * as a fallback if the webhook is ever misconfigured.
 *
 * Setup guide: docs/reference/sanity-revalidation-webhook.md
 */

interface WebhookPayload {
    _type?: string;
}

export async function POST(req: NextRequest) {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    if (!secret) {
        return new NextResponse('Revalidation secret not configured', {
            status: 500,
        });
    }

    try {
        const { isValidSignature, body } = await parseBody<WebhookPayload>(
            req,
            secret,
        );

        if (!isValidSignature) {
            return new NextResponse('Invalid signature', { status: 401 });
        }
        if (!body || typeof body._type !== 'string') {
            return new NextResponse('Bad request', { status: 400 });
        }

        revalidatePath('/', 'layout');
        return NextResponse.json({
            revalidated: true,
            type: body._type,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return new NextResponse(message, { status: 500 });
    }
}
