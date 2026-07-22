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
