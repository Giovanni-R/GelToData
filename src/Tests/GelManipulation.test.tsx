import React from 'react';
import { render } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect"
import { GelAndLaneManipulation } from '../Components/MainView/GelAndLaneProcessing/GelAndLaneManipulation';

/**
 * A very simple test to check that the component renders.
 */
test('renders GelAndLaneManipulation component and checks for the Image Processing section', () => {
  const { getByText } = render(<GelAndLaneManipulation components={3} size={{ width: 1000, height: 200 }} />);
  const sectionTitle = getByText(/Image preprocessing options:/i);
  expect(sectionTitle).toBeInTheDocument();
});

/**
 * A very simple test to check that the component renders.
 */
test('renders GelAndLaneManipulation component and checks for the Lane Selection section', () => {
  const { getByText } = render(<GelAndLaneManipulation components={1} size={{ width: 1000, height: 200 }} />);
  const sectionTitle = getByText(/Lane selection:/i);
  expect(sectionTitle).toBeInTheDocument();
});