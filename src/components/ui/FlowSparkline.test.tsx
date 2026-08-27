import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, expect, test, vi } from 'vitest';
import { FlowSparkline } from './FlowSparkline';

const series = [
    { date: '2026-08-21', cfs: 3400 },
    { date: '2026-08-22', cfs: 3450 },
    { date: '2026-08-23', cfs: 3500 },
    { date: '2026-08-24', cfs: 3560 },
];

// jsdom lays out nothing, so give the svg a real box for snap math.
beforeAll(() => {
    vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 64,
        bottom: 20,
        width: 64,
        height: 20,
        toJSON: () => ({}),
    } as DOMRect);
});

test('rests on the 7-day caption and reveals a point value on hover', () => {
    const { container } = render(<FlowSparkline series={series} />);
    const caption = screen.getByTestId('spark-caption');
    expect(caption).toHaveTextContent('past 7 days');

    const hit = screen.getByTestId('spark-hit');
    // Far right of the hit area snaps to the newest point — anywhere in
    // the lockup, not just on the svg line.
    fireEvent.pointerMove(hit, { clientX: 63, clientY: 30 });
    expect(caption).toHaveTextContent('Aug 24 · 3,560 CFS');
    expect(container.querySelector('circle')).not.toBeNull();

    // Far left snaps to the oldest.
    fireEvent.pointerMove(hit, { clientX: 1, clientY: 30 });
    expect(caption).toHaveTextContent('Aug 21 · 3,400 CFS');

    fireEvent.pointerLeave(hit);
    expect(caption).toHaveTextContent('past 7 days');
    expect(container.querySelector('circle')).toBeNull();
});

test('exposes the range and trend to screen readers', () => {
    render(<FlowSparkline series={series} />);
    expect(
        screen.getByText(/Past 7 days: 3,400–3,560 CFS/),
    ).toBeInTheDocument();
});

test('renders nothing with fewer than two points', () => {
    const { container } = render(
        <FlowSparkline series={[{ date: '2026-08-24', cfs: 100 }]} />,
    );
    expect(container).toBeEmptyDOMElement();
});
