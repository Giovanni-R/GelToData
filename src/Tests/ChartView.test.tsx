import React from 'react';
import { render } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect"
import { ChartView } from '../Components/MainView/LaneAnalysis/ChartView';

/**
 * A very simple test to check that the component renders.
 */
test('renders ChartView component and checks for the Show Charts button', () => {
  const { getByText } = render(<ChartView />);
  const showChartsButton = getByText(/Show Charts/i);
  expect(showChartsButton).toBeInTheDocument();
});