import React from 'react';
import { render } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect"
import App from '../App';

/**
 * A very simple test to check that the app renders.
 */
test('renders the welcome screen title', () => {
  const { getByText } = render(<App />);
  const pageTitle = getByText(/Welcome to GelToData!/i);
  expect(pageTitle).toBeInTheDocument();
});
