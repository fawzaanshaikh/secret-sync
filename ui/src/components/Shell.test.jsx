import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { test, expect } from 'vitest';
import { Shell } from './Shell.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { username: 'dev1', role: 'member' }, logout: () => {}, isAdmin: false }),
}));

test('Users nav link is hidden for a non-admin user', () => {
  render(
    <ThemeProvider>
      <MemoryRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<div>content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

  expect(screen.queryByText('Users')).not.toBeInTheDocument();
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
