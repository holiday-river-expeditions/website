import { redirect } from 'next/navigation';

// The Book Now CTA lands directly on Open Seats (Aug 20 decision) — the
// intermediate landing page is gone, but the route survives as a redirect
// so old links and bookmarks keep working. Open Seats carries the phone
// number and a path to the full trip catalog.
export default function BookPage() {
    redirect('/open-seats');
}
