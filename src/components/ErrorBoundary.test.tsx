/**
 * Tests for ErrorBoundary component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Suppress console.error for expected errors
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that works fine
const WorkingComponent = () => <div>Working component</div>;

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/une erreur s'est produite/i)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('renders minimal error UI when minimal prop is true', () => {
    render(
      <ErrorBoundary minimal>
        <ThrowError />
      </ErrorBoundary>
    );
    // Should show minimal error, not full page
    const retryButton = screen.getByText(/réessayer/i);
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveClass('text-xs');
  });

  it('calls onError callback when error is caught', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('resets error state when retry is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error state
    expect(screen.getByText(/une erreur s'est produite/i)).toBeInTheDocument();

    // Click retry
    const retryButton = screen.getByRole('button', { name: /réessayer/i });

    // Rerender with non-throwing component to simulate fixed issue
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    fireEvent.click(retryButton);
  });

  it('shows back button in full error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /retour/i })).toBeInTheDocument();
  });

  it('shows home button in full error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /accueil/i })).toBeInTheDocument();
  });

  it('shows reload link in full error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/rechargez la page/i)).toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(WorkingComponent);
    render(<WrappedComponent />);
    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);
    render(<WrappedComponent />);
    expect(screen.getByText(/une erreur s'est produite/i)).toBeInTheDocument();
  });

  it('passes errorBoundaryProps to ErrorBoundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError, {
      fallback: <div>Custom fallback</div>,
    });
    render(<WrappedComponent />);
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('sets correct displayName', () => {
    const NamedComponent = () => <div>Named</div>;
    NamedComponent.displayName = 'MyComponent';

    const WrappedComponent = withErrorBoundary(NamedComponent);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(MyComponent)');
  });

  it('uses component name when displayName is not set', () => {
    function TestComponent() {
      return <div>Test</div>;
    }

    const WrappedComponent = withErrorBoundary(TestComponent);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });

  it('passes props to wrapped component', () => {
    interface Props {
      message: string;
    }
    const PropsComponent = ({ message }: Props) => <div>{message}</div>;
    const WrappedComponent = withErrorBoundary(PropsComponent);

    render(<WrappedComponent message="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
