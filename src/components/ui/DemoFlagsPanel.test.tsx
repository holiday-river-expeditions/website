import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DemoFlagsPanel } from './DemoFlagsPanel';
import { DEMO_FLAGS, DEMO_STORAGE_KEY } from '@/lib/demo-flags';

function arm(flags: Record<string, boolean> = {}) {
    localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({ armed: true, flags }),
    );
}

afterEach(() => {
    localStorage.clear();
    for (const flag of DEMO_FLAGS) {
        document.documentElement.removeAttribute(`data-demo-${flag.id}`);
    }
});

describe('DemoFlagsPanel', () => {
    it('renders nothing when the browser is not armed', () => {
        const { container } = render(<DemoFlagsPanel />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the collapsed pill when armed', () => {
        arm();
        render(<DemoFlagsPanel />);
        expect(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        ).toBeInTheDocument();
    });

    it('shows a checkbox per registered flag when expanded', () => {
        arm();
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        expect(screen.getAllByRole('checkbox')).toHaveLength(DEMO_FLAGS.length);
        for (const flag of DEMO_FLAGS) {
            expect(
                screen.getByLabelText(flag.label, { exact: false }),
            ).toBeInTheDocument();
        }
    });

    it('toggling a flag writes storage and flips the html attribute', () => {
        arm();
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        const checkbox = screen.getByLabelText('Bold live-text logo', {
            exact: false,
        });

        fireEvent.click(checkbox);
        expect(
            document.documentElement.getAttribute('data-demo-logo-bold'),
        ).toBe('on');
        expect(
            JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) ?? '{}'),
        ).toEqual({ armed: true, flags: { 'logo-bold': true } });

        fireEvent.click(checkbox);
        expect(
            document.documentElement.hasAttribute('data-demo-logo-bold'),
        ).toBe(false);
    });

    it('reset all clears flags but keeps the panel armed', () => {
        arm({ 'logo-bold': true });
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Reset all' }));
        expect(
            JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) ?? '{}'),
        ).toEqual({ armed: true, flags: {} });
        expect(
            screen.getByRole('button', { name: 'Reset all' }),
        ).toBeInTheDocument();
    });

    it('disarm removes the storage key, attributes, and the panel', () => {
        arm({ 'logo-bold': true });
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Disarm' }));
        expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
        expect(
            document.documentElement.hasAttribute('data-demo-logo-bold'),
        ).toBe(false);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
