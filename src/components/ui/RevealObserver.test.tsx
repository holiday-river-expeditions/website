import { render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { RevealObserver } from './RevealObserver';

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let ioCallback: IOCallback;
let observed: Element[];

beforeEach(() => {
    observed = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            constructor(cb: IOCallback) {
                ioCallback = cb;
            }
            observe(el: Element) {
                observed.push(el);
            }
            unobserve() {}
            disconnect() {}
        },
    );
    vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
});

/** Places an element at a fixed spot relative to the viewport. */
function at(el: Element, top: number, height: number) {
    el.getBoundingClientRect = () =>
        ({ top, bottom: top + height, width: 300, height }) as DOMRect;
}

function page() {
    document.body.innerHTML = `
        <main>
            <div id="grid" data-reveal-stagger>
                <a id="c1"></a><a id="c2"></a><a id="c3"></a>
                <a id="c4"></a><a id="c5"></a><a id="c6"></a>
            </div>
            <div id="below" data-reveal></div>
        </main>`;
    const $ = (id: string) => document.getElementById(id)!;
    // A 1,100px grid whose first row peeks 90px into an 800px viewport.
    at($('grid'), 710, 1100);
    for (const id of ['c1', 'c2', 'c3']) at($(id), 710, 520);
    for (const id of ['c4', 'c5', 'c6']) at($(id), 1290, 520);
    at($('below'), 2000, 400);
    return $;
}

test('cards already on screen at load are shown, not hidden then faded in', () => {
    const $ = page();
    render(<RevealObserver />);

    expect(document.documentElement.dataset.reveal).toBe('on');
    for (const id of ['c1', 'c2', 'c3']) {
        expect($(id)).toHaveAttribute('data-revealed');
    }
    for (const id of ['c4', 'c5', 'c6', 'below']) {
        expect($(id)).not.toHaveAttribute('data-revealed');
    }
});

test('grid children are observed one by one, not the grid as a whole', () => {
    const $ = page();
    render(<RevealObserver />);

    expect(observed).not.toContain($('grid'));
    expect(observed).toEqual(
        expect.arrayContaining([$('c4'), $('c5'), $('c6'), $('below')]),
    );
});

test('a row scrolled into view steps in left to right', () => {
    const $ = page();
    render(<RevealObserver />);

    ioCallback(
        ['c4', 'c5', 'c6'].map((id) => ({
            target: $(id),
            isIntersecting: true,
        })),
    );

    expect($('c4').dataset.revealStep).toBe('0');
    expect($('c5').dataset.revealStep).toBe('1');
    expect($('c6').dataset.revealStep).toBe('2');
    for (const id of ['c4', 'c5', 'c6']) {
        expect($(id)).toHaveAttribute('data-revealed');
    }
    expect($('below')).not.toHaveAttribute('data-revealed');
});

test('does nothing for visitors who prefer reduced motion', () => {
    const $ = page();
    const matchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    try {
        render(<RevealObserver />);
        expect(document.documentElement.dataset.reveal).toBeUndefined();
        expect($('c1')).not.toHaveAttribute('data-revealed');
    } finally {
        window.matchMedia = matchMedia;
    }
});
