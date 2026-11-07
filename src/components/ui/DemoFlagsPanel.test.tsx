import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DemoFlagsPanel } from './DemoFlagsPanel';
import {
    DEMO_FLAG_GROUPS,
    DEMO_FLAGS,
    DEMO_STORAGE_KEY,
} from '@/lib/demo-flags';

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

    it('renders every flag as a checkbox', () => {
        // No radio groups are live since the logo and hero groups
        // graduated on 2026-11-06.
        arm();
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        expect(Object.keys(DEMO_FLAG_GROUPS)).toHaveLength(0);
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        expect(screen.getAllByRole('checkbox')).toHaveLength(DEMO_FLAGS.length);
        for (const flag of DEMO_FLAGS) {
            expect(
                screen.getByLabelText(flag.label, { exact: false }),
            ).toBeInTheDocument();
        }
    });

    it('toggling an ungrouped flag writes storage and flips the attribute', () => {
        arm();
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        const checkbox = screen.getByLabelText('Trip finder logic panel', {
            exact: false,
        });

        fireEvent.click(checkbox);
        expect(
            document.documentElement.getAttribute('data-demo-finder-logic'),
        ).toBe('on');

        fireEvent.click(checkbox);
        expect(
            document.documentElement.hasAttribute('data-demo-finder-logic'),
        ).toBe(false);
    });

    it('reset all clears flags but keeps the panel armed', () => {
        arm({ 'finder-logic': true });
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
        arm({ 'finder-logic': true });
        render(<DemoFlagsPanel />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Open demo flags panel' }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Disarm' }));
        expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
        expect(
            document.documentElement.hasAttribute('data-demo-finder-logic'),
        ).toBe(false);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
