import React from 'react'

/**
 * A simple error boundary component.
 */
export class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {

  constructor(props: Readonly<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Log the error
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return <p>Something went wrong.</p>;
    }

    return this.props.children;
  }
}