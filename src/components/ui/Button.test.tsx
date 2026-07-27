/**
 * Tests for Button components
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, FloatingButton } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#0f172a]');
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#f7f8fa]');
  });

  it('applies outline variant styles', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-[#f7f8fa]');
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-500');
  });

  it('applies small size styles', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3.5', 'py-1.5', 'text-[13px]');
  });

  it('applies medium size by default', () => {
    render(<Button>Medium</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-5', 'py-2.5', 'text-sm');
  });

  it('applies large size styles', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('renders left icon', () => {
    render(<Button leftIcon={<span data-testid="left-icon">L</span>}>With Icon</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Button rightIcon={<span data-testid="right-icon">R</span>}>With Icon</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('does not show left icon when loading', () => {
    render(
      <Button isLoading leftIcon={<span data-testid="left-icon">L</span>}>
        Loading
      </Button>
    );
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
  });

  it('applies rounded styles when rounded prop is true', () => {
    render(<Button rounded>Rounded</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('rounded-full');
  });

  it('applies default border radius when rounded is false', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('rounded-xl');
  });

  it('has type="button" by default', () => {
    render(<Button>Button</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('accepts custom type', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('passes through additional props', () => {
    render(
      <Button data-testid="test-button" aria-label="Test">
        Test
      </Button>
    );
    expect(screen.getByTestId('test-button')).toHaveAttribute('aria-label', 'Test');
  });
});

describe('FloatingButton', () => {
  it('renders children correctly', () => {
    render(<FloatingButton>+</FloatingButton>);
    expect(screen.getByRole('button')).toHaveTextContent('+');
  });

  it('applies default variant styles', () => {
    render(<FloatingButton>+</FloatingButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#0f172a]');
  });

  it('applies danger variant styles', () => {
    render(<FloatingButton variant="danger">X</FloatingButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-500');
  });

  it('applies small size', () => {
    render(<FloatingButton size="sm">+</FloatingButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-8', 'h-8');
  });

  it('applies medium size by default', () => {
    render(<FloatingButton>+</FloatingButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-10', 'h-10');
  });

  it('applies large size', () => {
    render(<FloatingButton size="lg">+</FloatingButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-12', 'h-12');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<FloatingButton onClick={handleClick}>+</FloatingButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has type="button" by default', () => {
    render(<FloatingButton>+</FloatingButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('is always rounded', () => {
    render(<FloatingButton>+</FloatingButton>);
    expect(screen.getByRole('button')).toHaveClass('rounded-full');
  });
});
