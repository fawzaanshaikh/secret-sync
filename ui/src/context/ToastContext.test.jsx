import { render, screen, fireEvent } from '@testing-library/react';
import { test, expect } from 'vitest';
import { ToastProvider, useToast } from './ToastContext.jsx';

function Trigger() {
  const { showError, showSuccess } = useToast();
  return (
    <>
      <button type="button" onClick={() => showError('Number must be less than or equal to 10')}>
        Trigger error
      </button>
      <button type="button" onClick={() => showSuccess('Saved')}>
        Trigger success
      </button>
    </>
  );
}

test('shows an error toast with the message, styled as an error', () => {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  );

  fireEvent.click(screen.getByText('Trigger error'));

  const toast = screen.getByRole('alert');
  expect(toast).toHaveTextContent('Number must be less than or equal to 10');
  expect(toast).toHaveClass('toast-error');
});

test('dismisses a toast when its close button is clicked', () => {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  );

  fireEvent.click(screen.getByText('Trigger success'));
  expect(screen.getByRole('alert')).toHaveClass('toast-success');

  fireEvent.click(screen.getByLabelText('Dismiss'));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('stacks multiple toasts independently', () => {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  );

  fireEvent.click(screen.getByText('Trigger error'));
  fireEvent.click(screen.getByText('Trigger success'));

  expect(screen.getAllByRole('alert')).toHaveLength(2);
});
