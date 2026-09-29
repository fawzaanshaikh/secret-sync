import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export function Shell() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="brand">SecretSync</div>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/review" className={({ isActive }) => (isActive ? 'active' : '')}>
          Review queue
        </NavLink>
        {isAdmin && (
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
            Users
          </NavLink>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button type="button" className="btn" style={{ width: '100%', marginBottom: 8 }} onClick={toggleTheme}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="muted">{user?.username}, {user?.role}</div>
          <button type="button" className="btn" style={{ marginTop: 8, width: '100%' }} onClick={logout}>
            Log out
          </button>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
