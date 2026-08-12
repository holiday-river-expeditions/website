import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

// Stand in for the Sanity CDN builder: any uploaded asset resolves to a URL,
// anything unset resolves to '' exactly as the real helper does.
vi.mock('@/lib/sanity', () => ({
    imageUrl: (source: { asset?: { _ref?: string } } | null | undefined) =>
        source?.asset?._ref ? `https://cdn.sanity.io/${source.asset._ref}` : '',
}));

import { ItinerarySection } from './ItinerarySection';

const days = [
    {
        _key: 'a',
        day: 'Day 1',
        title: 'Put-in',
        description: 'Rig and launch.',
    },
    { _key: 'b', day: 'Day 2', title: 'Big water', description: 'Rapids.' },
];

const poster = { asset: { _ref: 'image-abc-960x1280-jpg' } };

test('renders nothing when the trip has no itinerary', () => {
    const { container } = render(<ItinerarySection days={[]} />);
    expect(container).toBeEmptyDOMElement();
});

test('falls back to the plain rapids band when the trip has no media', () => {
    const { container } = render(<ItinerarySection days={days} />);

    expect(
        screen.getByRole('heading', { level: 2, name: /a day on the river/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Put-in')).toBeInTheDocument();
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.bg-canvas')).not.toBeNull();
});

test('shows no imagery when there is a poster but no video', () => {
    const { container } = render(
        <ItinerarySection
            days={days}
            media={{ videoUrl: null, poster, alt: 'Rafts at dawn' }}
        />,
    );

    // The poster is the video's first frame, not a standalone illustration —
    // with no clip the band is the rapids texture alone.
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
});

test('ignores a video with no poster, which would load as a black band', () => {
    const { container } = render(
        <ItinerarySection
            days={days}
            media={{ videoUrl: 'https://cdn.sanity.io/clip.mp4', poster: null }}
        />,
    );

    expect(container.querySelector('video')).toBeNull();
    expect(screen.getByText('Put-in')).toBeInTheDocument();
});

test('renders the ambient video without autoplaying or attaching a source', () => {
    const { container } = render(
        <ItinerarySection
            days={days}
            media={{
                videoUrl: 'https://cdn.sanity.io/clip.mp4',
                poster,
                alt: 'Rafts at dawn',
            }}
        />,
    );

    // The poster renders underneath as the base layer, so there is always
    // something to look at before (and instead of) playback. It is decorative
    // — the scrim and accordion carry the meaning — so alt is empty.
    const poster_img = container.querySelector('img');
    expect(poster_img).not.toBeNull();
    expect(poster_img).toHaveAttribute('alt', '');

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    // The markup must never carry autoPlay — motion is a JS decision so that
    // prefers-reduced-motion can veto it.
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('aria-hidden', 'true');
    // No poster attribute: that would double-fetch the frame next/image
    // already serves underneath.
    expect(video).not.toHaveAttribute('poster');

    // Nothing is fetched and no pause control is offered until the panel is
    // known to be on screen — jsdom has no IntersectionObserver, so this is
    // the state before the 3s geometry failsafe would run.
    expect(video).not.toHaveAttribute('src');
    expect(
        screen.queryByRole('button', { name: /background video/i }),
    ).toBeNull();
});
