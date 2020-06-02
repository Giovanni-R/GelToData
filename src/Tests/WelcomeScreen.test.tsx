import React from 'react';
import { render } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect"
import { WelcomeScreen } from '../Components/WelcomeScreen/WelcomeScreen';

/**
 * A very simple test to check that WelcomeScreen renders.
 */
test('renders the welcome screen and checks for the title', () => {
  const { getByText } = render(
    <WelcomeScreen
      isFirstVisit={true}
      onFileLoad={(files: FileList | null) => { return }}
      onSampleLoad={(fileURL: string) => { return }}
    />)
    ;
  const pageTitle = getByText(/Welcome to GelToData!/i);
  expect(pageTitle).toBeInTheDocument();
});

/**
 * A very simple test to check that WelcomeScreen renders the import button
 */
test('renders the welcome screen and checks for the image import button', () => {
  const { getByText } = render(
    <WelcomeScreen
      isFirstVisit={true}
      onFileLoad={(files: FileList | null) => { return }}
      onSampleLoad={(fileURL: string) => { return }}
    />)
    ;
  const importButton = getByText(/Import Image/i);
  expect(importButton).toBeInTheDocument();
});