import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

import { SiteFrame } from './SiteFrame';

const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({
    usePathname: () => pathname.current,
}));

function renderFrame() {
    return render(
        <SiteFrame
            chrome={<div data-testid='chrome' />}
            header={<header>Site header</header>}
            footer={<footer>Site footer</footer>}
        >
            <p>Page body</p>
        </SiteFrame>,
    );
}

beforeEach(() => {
    pathname.current = '/';
});

test('wraps a site page in the header, main and footer', () => {
    renderFrame();
    expect(screen.getByRole('banner')).toHaveTextContent('Site header');
    expect(screen.getByRole('main')).toHaveTextContent('Page body');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Site footer');
    expect(screen.getByTestId('chrome')).toBeInTheDocument();
});

test('renders the Studio bare so it gets the whole viewport', () => {
    pathname.current = '/studio/structure/trip';
    renderFrame();
    expect(screen.getByText('Page body')).toBeInTheDocument();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('main')).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
    expect(screen.queryByTestId('chrome')).toBeNull();
});
