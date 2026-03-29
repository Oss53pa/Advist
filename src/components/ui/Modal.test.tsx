/**
 * Tests for Modal Component
 */
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '../../test/test-utils';
import { Modal } from './Modal';

describe('Modal', () => {
  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Modal Content</p>
      </Modal>
    );

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Modal Content</p>
      </Modal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    renderWithProviders(
      <Modal isOpen={true} onClose={() => {}} title="Test Title">
        <p>Modal Content</p>
      </Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = vi.fn();

    renderWithProviders(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Modal Content</p>
      </Modal>
    );

    // Find and click the close button (X icon)
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should render with different sizes', () => {
    const { rerender } = renderWithProviders(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        <p>Small Modal</p>
      </Modal>
    );

    expect(screen.getByText('Small Modal')).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        <p>Large Modal</p>
      </Modal>
    );

    expect(screen.getByText('Large Modal')).toBeInTheDocument();
  });
});
