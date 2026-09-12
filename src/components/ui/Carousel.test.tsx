import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Carousel } from './Carousel';

test('one slide renders plainly, with no carousel chrome', () => {
    render(<Carousel label='Photos' slides={[<p key='a'>Only one</p>]} />);
    expect(screen.getByText('Only one')).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('several slides get the carousel roles, a counter, and bounded buttons', () => {
    render(
        <Carousel
            label='Guest reviews'
            slides={[
                <p key='a'>First</p>,
                <p key='b'>Second</p>,
                <p key='c'>Third</p>,
            ]}
        />,
    );
    const region = screen.getByRole('region', { name: 'Guest reviews' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    expect(screen.getAllByRole('group')).toHaveLength(3);
    expect(screen.getByRole('group', { name: '1 of 3' })).toHaveTextContent(
        'First',
    );
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    // Nothing before the first slide.
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
});

test('Next scrolls the track to the following slide', () => {
    vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({ matches: false })),
    );
    render(
        <Carousel
            label='Photos'
            slides={[<p key='a'>First</p>, <p key='b'>Second</p>]}
        />,
    );
    const track = screen.getByRole('group', { name: '1 of 2' })
        .parentElement as HTMLElement;
    const scrollTo = vi.fn();
    track.scrollTo = scrollTo;
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' }),
    );
});
