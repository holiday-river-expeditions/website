import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Home from './page';

test('renders the home page', () => {
  render(<Home />);
  expect(screen.getByText('Holiday River Expeditions')).toBeInTheDocument();
});
