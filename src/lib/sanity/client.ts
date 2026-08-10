import { apiVersion, dataset, projectId } from '@/sanity/env';
import { createClient } from 'next-sanity';

export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    // All fetches happen server-side inside Next's cache (ISR + webhook
    // revalidation), so hit the live API: Sanity's CDN is eventually
    // consistent and can serve pre-publish content right after a webhook
    // purge, defeating "instant publish". Next's cache is the perf layer.
    useCdn: false,
});

// Token-authenticated client for API routes that write documents (contact
// form submissions, newsletter signups). Server-only: SANITY_API_TOKEN has
// no NEXT_PUBLIC_ prefix, so it never reaches the browser bundle.
export const writeClient = client.withConfig({
    token: process.env.SANITY_API_TOKEN,
});
