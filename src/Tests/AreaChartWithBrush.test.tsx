import React from 'react';
import { render } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect"
import { AreaChartWithBrush } from '../Components/Charts/StackedAreaChart/AreaChartWithBrush';

/**
 * A very simple test to check that the component renders.
 */
test('renders an AreaChartWithBrush to check for any errors', () => {
  const { getByText } = render(
    <AreaChartWithBrush
      data={[[0.1, 0.3, 0.6], [0.1, 0.3, 0.6], [0.1, 0.3, 0.6]]}
      size={{ width: 1000, height: 200 }}
      margin={{ top: 30, bottom: 30, left: 30, right: 30 }}
    />
  );
});