import { afterEach, describe, expect, it } from 'vitest';
import {
    DEMO_FLAGS,
    DEMO_INIT_SCRIPT,
    DEMO_STORAGE_KEY,
    DISARMED,
    parseDemoState,
} from './demo-flags';

function runInitScript() {
    new Function(DEMO_INIT_SCRIPT)();
}

function clearDemoAttributes() {
    for (const flag of DEMO_FLAGS) {
        document.documentElement.removeAttribute(`data-demo-${flag.id}`);
    }
}

afterEach(() => {
    localStorage.clear();
    clearDemoAttributes();
});

describe('parseDemoState', () => {
    it('returns the disarmed default for a missing value', () => {
        expect(parseDemoState(null)).toEqual(DISARMED);
    });

    it('returns the disarmed default for garbage JSON', () => {
        expect(parseDemoState('not json {')).toEqual(DISARMED);
    });

    it('returns the disarmed default for a wrong shape', () => {
        expect(parseDemoState('{"armed":"yes"}')).toEqual(DISARMED);
        expect(parseDemoState('{"flags":{}}')).toEqual(DISARMED);
        expect(
            parseDemoState('{"armed":true,"flags":{"finder-logic":"on"}}'),
        ).toEqual(DISARMED);
    });

    it('drops a retired flag instead of disarming the browser', () => {
        expect(
            parseDemoState(
                JSON.stringify({
                    armed: true,
                    flags: { 'logo-bold': true, 'finder-logic': true },
                }),
            ),
        ).toEqual({ armed: true, flags: { 'finder-logic': true } });
    });

    it('round-trips a valid state', () => {
        const state = { armed: true, flags: { 'finder-logic': true } };
        expect(parseDemoState(JSON.stringify(state))).toEqual(state);
    });
});

describe('DEMO_INIT_SCRIPT', () => {
    it('mentions every registered flag id', () => {
        for (const flag of DEMO_FLAGS) {
            expect(DEMO_INIT_SCRIPT).toContain(flag.id);
        }
    });

    it('sets no attributes when storage is empty', () => {
        runInitScript();
        for (const flag of DEMO_FLAGS) {
            expect(
                document.documentElement.hasAttribute(`data-demo-${flag.id}`),
            ).toBe(false);
        }
    });

    it('sets no attributes for garbage storage', () => {
        localStorage.setItem(DEMO_STORAGE_KEY, 'garbage {');
        runInitScript();
        expect(
            document.documentElement.hasAttribute('data-demo-finder-logic'),
        ).toBe(false);
    });

    it('sets no attributes for non-boolean flag values', () => {
        localStorage.setItem(
            DEMO_STORAGE_KEY,
            '{"armed":true,"flags":{"finder-logic":"on"}}',
        );
        runInitScript();
        expect(
            document.documentElement.hasAttribute('data-demo-finder-logic'),
        ).toBe(false);
    });

    it('sets the attribute for a flag stored as true', () => {
        localStorage.setItem(
            DEMO_STORAGE_KEY,
            JSON.stringify({ armed: true, flags: { 'finder-logic': true } }),
        );
        runInitScript();
        expect(
            document.documentElement.getAttribute('data-demo-finder-logic'),
        ).toBe('on');
    });
});
