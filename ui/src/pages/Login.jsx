import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../lib/auth-context';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setSubmitError(err.message ?? 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="7" fill="#0b0d10" />
            <path d="M11 14v-3a5 5 0 0 1 10 0v3" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
            <rect x="8.5" y="14" width="15" height="11" rx="2" fill="#34d399" fillOpacity="0.12" stroke="#34d399" strokeWidth="2" />
            <circle cx="16" cy="19" r="1.6" fill="#34d399" />
            <path d="M16 20.6v2.2" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <h1 className="font-mono text-lg font-semibold text-text-bright">
              secret<span className="text-accent">sync</span>
            </h1>
            <p className="mt-1 text-sm text-text-dim">Sign in to your workspace</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-border bg-bg-panel p-6"
        >
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          {submitError && (
            <p className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
              {submitError}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-text-dim">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
