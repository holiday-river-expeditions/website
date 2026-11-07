import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { HeaderHeight } from './HeaderHeight';

const root = document.documentElement;
const condensed = () => root.hasAttribute('data-header-condensed');

function scrollTo(y: number) {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    act(() => {
        window.dispatchEvent(new Event('scroll'));
    });
}

beforeEach(() => {
    // Run the rAF-throttled update straight away, and return 0 so the
    // component doesn't think a frame is still pending afterwards.
    vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) => {
        run(0);
        return 0;
    });
    scrollTo(0);
});
afterEach(() => {
    vi.unstubAllGlobals();
});

function renderHeader() {
    return render(
        <header data-site-header>
            <HeaderHeight />
        </header>,
    );
}

test('condenses once scrolled and opens again at the top', () => {
    renderHeader();
    expect(condensed()).toBe(false);

    scrollTo(30);
    expect(condensed()).toBe(false);
    scrollTo(60);
    expect(condensed()).toBe(true);

    // Between the two lines nothing changes, so a scroll that settles
    // there doesn't flicker.
    scrollTo(20);
    expect(condensed()).toBe(true);
    scrollTo(4);
    expect(condensed()).toBe(false);
});

test('a page loaded part way down starts condensed', () => {
    Object.defineProperty(window, 'scrollY', {
        value: 500,
        configurable: true,
    });
    renderHeader();
    expect(condensed()).toBe(true);
});

test('cleans up its attribute and variable on unmount', () => {
    const { unmount } = renderHeader();
    scrollTo(200);
    expect(condensed()).toBe(true);
    unmount();
    expect(condensed()).toBe(false);
    expect(root.style.getPropertyValue('--site-header-h')).toBe('');
});
