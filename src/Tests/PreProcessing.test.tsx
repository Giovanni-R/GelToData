import React from 'react';
import { render } from '@testing-library/react';
import { PreProcessing } from '../Components/MainView/GelAndLaneProcessing/PreProcessing/PreProcessing';
import { imagePreProcessingOptions } from '../definitions';

/**
 * A very simple test to check that the component renders.
 */
test('renders the PreProcessing component and checks for the section title', () => {
  const { getByText } = render(
    <PreProcessing
      components={1}
      size={{ width: 1000, height: 200 }}
      onSettingsChange={(s: imagePreProcessingOptions) => { return }}
    />);
  const pageTitle = getByText(/Image preprocessing options:/i);
  expect(pageTitle).toBeInTheDocument();
});