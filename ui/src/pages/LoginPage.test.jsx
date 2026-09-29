import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, test, expect, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

vi.mock('../api/client.js', () => ({
  api: { login: vi.fn() },
  setAuthToken: vi.fn(),
}));

import { api } from '../api/client.js';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

test('submits credentials and shows an error on failure', async () => {
  api.login.mockRejectedValue(new Error('Invalid credentials'));

  render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'dev1' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

  await waitFor(() => screen.getByText('Invalid credentials'));
  expect(api.login).toHaveBeenCalledWith('dev1', 'wrongpass');
});
