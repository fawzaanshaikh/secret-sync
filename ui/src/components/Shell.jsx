import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="7" fill="#0b0d10" />
        <path
          d="M11 14v-3a5 5 0 0 1 10 0v3"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="8.5"
          y="14"
          width="15"
          height="11"
          rx="2"
          fill="#34d399"
          fillOpacity="0.12"
          stroke="#34d399"
          strokeWidth="2"
        />
        <circle cx="16" cy="19" r="1.6" fill="#34d399" />
        <path d="M16 20.6v2.2" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-mono text-sm font-semibold tracking-tight text-text-bright">
        secret<span className="text-accent">sync</span>
      </span>
    </Link>
  );
}

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-svh bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          {user && (
            <div className="flex items-center gap-4">
              <span className="hidden font-mono text-xs text-text-dim sm:inline">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="cursor-pointer rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-text-dim transition-colors hover:border-danger-border hover:text-danger"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
