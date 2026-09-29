import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { EnvVarEditor } from './EnvVarEditor.jsx';
import { api } from '../api/client.js';

vi.mock('../api/client.js', () => ({
  api: {
    listEnvVars: vi.fn(),
    submitEnvChanges: vi.fn(),
  },
}));

const unprotectedBranch = { id: 1, name: 'feature/x', is_protected: 0, required_approvals: 1 };
const protectedBranch = { id: 2, name: 'main', is_protected: 1, required_approvals: 1 };

beforeEach(() => {
  vi.clearAllMocks();
});

test('values are masked by default and reveal on click', async () => {
  api.listEnvVars.mockResolvedValue([{ key: 'API_KEY', value: 'secret123' }]);
  render(<EnvVarEditor projectId="1" branch={unprotectedBranch} canWrite />);

  await waitFor(() => expect(screen.getByDisplayValue('secret123')).toHaveAttribute('type', 'password'));

  fireEvent.click(screen.getByText('Reveal'));
  expect(screen.getByDisplayValue('secret123')).toHaveAttribute('type', 'text');
});

test('save button stays disabled until a change is made', async () => {
  api.listEnvVars.mockResolvedValue([{ key: 'API_KEY', value: 'secret123' }]);
  render(<EnvVarEditor projectId="1" branch={unprotectedBranch} canWrite />);

  await waitFor(() => screen.getByText('Save changes'));
  expect(screen.getByText('Save changes')).toBeDisabled();

  fireEvent.change(screen.getByDisplayValue('secret123'), { target: { value: 'newvalue' } });
  expect(screen.getByText('Save changes')).not.toBeDisabled();
});

test('unprotected branch applies changes directly', async () => {
  api.listEnvVars.mockResolvedValue([{ key: 'API_KEY', value: 'old' }]);
  api.submitEnvChanges.mockResolvedValue([{ key: 'API_KEY', value: 'new' }]);
  render(<EnvVarEditor projectId="1" branch={unprotectedBranch} canWrite />);

  await waitFor(() => screen.getByDisplayValue('old'));
  fireEvent.change(screen.getByDisplayValue('old'), { target: { value: 'new' } });
  fireEvent.click(screen.getByText('Save changes'));

  await waitFor(() => expect(api.submitEnvChanges).toHaveBeenCalledWith('1', 1, [
    { key: 'API_KEY', action: 'update', newValue: 'new' },
  ]));
  await waitFor(() => screen.getByText('Changes applied.'));
});

test('protected branch shows proposal confirmation instead of applying directly', async () => {
  api.listEnvVars.mockResolvedValue([]);
  api.submitEnvChanges.mockResolvedValue({ proposal: { id: 7 } });
  render(<EnvVarEditor projectId="1" branch={protectedBranch} canWrite />);

  await waitFor(() => screen.getByPlaceholderText('KEY'));
  fireEvent.change(screen.getByPlaceholderText('KEY'), { target: { value: 'NEW_KEY' } });
  fireEvent.change(screen.getByPlaceholderText('value'), { target: { value: 'val' } });
  fireEvent.click(screen.getByText('Add'));
  fireEvent.click(screen.getByText('Submit for review'));

  await waitFor(() => screen.getByText(/Proposal #7 submitted, awaiting review\./));
});
