import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// Testing Library's auto-cleanup only registers itself when Vitest globals are
// enabled, and this project runs without them — so unmount explicitly, or a
// file's second render finds duplicate matches from the first.
afterEach(cleanup);

// jsdom ships no matchMedia. Components that gate motion on it (RevealObserver,
// AmbientVideo) would throw on mount; default to "no preference expressed".
if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
}
