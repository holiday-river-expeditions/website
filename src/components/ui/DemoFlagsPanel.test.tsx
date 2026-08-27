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

    it('renders grouped flags as radios and the rest as checkboxes', () => {
        arm();
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        const grouped = DEMO_FLAGS.filter((flag) => 'group' in flag);
        const ungrouped = DEMO_FLAGS.filter((flag) => !('group' in flag));
        // One extra radio per group: the "default" option.
        expect(screen.getAllByRole('radio')).toHaveLength(grouped.length + 1);
        expect(screen.getAllByRole('checkbox')).toHaveLength(ungrouped.length);
        for (const flag of DEMO_FLAGS) {
            expect(
                screen.getByLabelText(flag.label, { exact: false }),
            ).toBeInTheDocument();
        }
    });

    it('picking a logo radio sets its flag and clears the rest of the group', () => {
        arm({ 'logo-line': true });
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        const bold = screen.getByRole('radio', {
            name: /Bold live-text lockup/,
        });

        fireEvent.click(bold);
        expect(
            document.documentElement.getAttribute('data-demo-logo-bold'),
        ).toBe('on');
        expect(
            document.documentElement.hasAttribute('data-demo-logo-line'),
        ).toBe(false);
        const stored = JSON.parse(
            localStorage.getItem(DEMO_STORAGE_KEY) ?? '{}',
        );
        expect(stored.flags['logo-bold']).toBe(true);
        expect(stored.flags['logo-line']).toBe(false);

        // The default option returns the group to classic.
        fireEvent.click(
            screen.getByRole('radio', { name: /Classic SVG lockup/ }),
        );
        expect(
            document.documentElement.hasAttribute('data-demo-logo-bold'),
        ).toBe(false);
    });

    it('toggling an ungrouped flag writes storage and flips the attribute', () => {
        arm();
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        const checkbox = screen.getByLabelText('Live river flow', {
            exact: false,
        });

        fireEvent.click(checkbox);
        expect(
            document.documentElement.getAttribute('data-demo-river-flow'),
        ).toBe('on');

        fireEvent.click(checkbox);
        expect(
            document.documentElement.hasAttribute('data-demo-river-flow'),
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
