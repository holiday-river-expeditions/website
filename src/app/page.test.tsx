import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Home from './page';

vi.mock('next/image', () => ({
  default: (props: React.ComponentProps<'img'>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

test('renders the home page', () => {
  render(<Home />);
  expect(screen.getByText(/to get started/i)).toBeInTheDocument();
});
