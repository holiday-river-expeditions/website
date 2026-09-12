import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import {
    AnniversaryBadge,
    anniversaryLabel,
    anniversaryYears,
    BADGE_SRC,
    FOUNDED_YEAR,
} from './AnniversaryBadge';

test('counts the years since 1966 and labels anything past 60 as 60+', () => {
    expect(FOUNDED_YEAR).toBe(1966);
    expect(anniversaryYears(new Date(2026, 5, 1))).toBe(60);
    expect(anniversaryYears(new Date(2027, 0, 1))).toBe(61);
    expect(anniversaryLabel(60)).toBe('60');
    expect(anniversaryLabel(61)).toBe('60+');
    expect(anniversaryLabel(75)).toBe('60+');
});

test('the 60th year is the static artwork, nothing added', () => {
    const { container } = render(<AnniversaryBadge years={60} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute(
        'aria-label',
        '60 years of going with the flow',
    );
    expect(svg?.querySelector('use')).toHaveAttribute(
        'href',
        `${BADGE_SRC}#seal`,
    );
    expect(svg?.querySelectorAll('text')).toHaveLength(0);
});

test('later years keep the artwork and add a plus', () => {
    const { container } = render(<AnniversaryBadge years={61} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute(
        'aria-label',
        '60+ years of going with the flow',
    );
    expect(svg?.querySelector('use')).toBeInTheDocument();
    expect(svg?.querySelector('text')?.textContent?.trim()).toBe('+');
});
