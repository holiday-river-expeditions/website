import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { HeroVideo } from './HeroVideo';

// jsdom can't play media: canPlayType returns '' and play() throws.
let canPlay = 'maybe';
beforeEach(() => {
    canPlay = 'maybe';
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation(
        () => canPlay as CanPlayTypeResult,
    );
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => {
    vi.restoreAllMocks();
});

function preferReducedMotion(reduce: boolean) {
    vi.spyOn(window, 'matchMedia').mockImplementation(
        (query: string) =>
            ({
                matches: reduce && query.includes('reduce'),
                media: query,
            }) as MediaQueryList,
    );
}

test('plays the loop over the photo by default', () => {
    preferReducedMotion(false);
    const { container } = render(<HeroVideo />);
    expect(container.querySelector('video')).not.toBeNull();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
});

test('keeps the photo for reduced motion and offers a play button', () => {
    preferReducedMotion(true);
    const { container } = render(<HeroVideo />);
    expect(container.querySelector('video')).toBeNull();

    fireEvent.click(
        screen.getByRole('button', { name: 'Play background video' }),
    );
    expect(container.querySelector('video')).not.toBeNull();
});

test('renders nothing when the browser cannot play MP4', () => {
    canPlay = '';
    preferReducedMotion(false);
    const { container } = render(<HeroVideo />);
    expect(container).toBeEmptyDOMElement();
});
