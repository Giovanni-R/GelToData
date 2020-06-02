import React from 'react';
import { render } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect"
import { GelView } from '../Components/MainView/GelAndLaneProcessing/GelAndLaneView/GelView';

/**
 * A very simple test to check that the component renders.
 */
test('renders the GelView component and checks for the section title', () => {
  const { getByText } = render(
    <GelView
      imageDataURL="./bw.png"
      size={{ width: 1000, height: 200 }}
      children={<></>} />);
  const pageTitle = getByText(/Lane selection:/i);
  expect(pageTitle).toBeInTheDocument();
});