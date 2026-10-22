import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { HeaderReveal } from './HeaderReveal';

const root = document.documentElement;
const hidden = () => root.hasAttribute('data-header-hidden');

function scrollTo(y: number) {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    act(() => {
        window.dispatchEvent(new Event('scroll'));
    });
}

function renderHeader() {
    return render(
        <>
            <header data-site-header>
                <button type='button'>Menu</button>
                <HeaderReveal />
            </header>
            <a href='#faqs'>FAQs</a>
        </>,
    );
}

beforeEach(() => {
    scrollTo(0);
    root.setAttribute('data-demo-header-reveal', 'on');
});
afterEach(() => {
    root.removeAttribute('data-demo-header-reveal');
    root.removeAttribute('data-demo-sticky-header');
    vi.useRealTimers();
});

test('hides on scroll down and comes back on scroll up', () => {
    renderHeader();
    scrollTo(400);
    expect(hidden()).toBe(true);
    scrollTo(380);
    expect(hidden()).toBe(false);
});

test('ignores moves smaller than the threshold', () => {
    renderHeader();
    scrollTo(400);
    scrollTo(396);
    expect(hidden()).toBe(true);
});

test('shows at the top of the page', () => {
    renderHeader();
    scrollTo(400);
    scrollTo(0);
    expect(hidden()).toBe(false);
});

test('stays out while focus is inside it', () => {
    const { getByRole } = renderHeader();
    act(() => getByRole('button', { name: 'Menu' }).focus());
    scrollTo(400);
    expect(hidden()).toBe(false);
});

test('an anchor jump hides it and ignores the jump scroll', () => {
    vi.useFakeTimers();
    const { getByRole } = renderHeader();
    scrollTo(2000);
    scrollTo(1900);
    expect(hidden()).toBe(false);

    fireEvent.click(getByRole('link', { name: 'FAQs' }));
    expect(hidden()).toBe(true);
    // The jump scrolls up the page, which would normally reveal it.
    scrollTo(1200);
    scrollTo(800);
    expect(hidden()).toBe(true);

    act(() => vi.advanceTimersByTime(200));
    scrollTo(780);
    expect(hidden()).toBe(false);
});

test('does nothing when sticky-header is also on', () => {
    root.setAttribute('data-demo-sticky-header', 'on');
    renderHeader();
    scrollTo(400);
    expect(hidden()).toBe(false);
});

test('does nothing when the flag is off', () => {
    root.removeAttribute('data-demo-header-reveal');
    renderHeader();
    scrollTo(400);
    expect(hidden()).toBe(false);
});

test('measures the header for either header flag, and only then', () => {
    const height = () => root.style.getPropertyValue('--site-header-h');
    const { unmount } = renderHeader();
    expect(height()).toBe('0px');
    unmount();
    expect(height()).toBe('');

    root.removeAttribute('data-demo-header-reveal');
    root.setAttribute('data-demo-sticky-header', 'on');
    renderHeader().unmount();
    root.removeAttribute('data-demo-sticky-header');
    const { unmount: last } = renderHeader();
    expect(height()).toBe('');
    last();
});
