import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function SetupPage() {
  const { setup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await setup(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-main" style={{ maxWidth: 420, margin: '80px auto' }}>
      <div className="card">
        <h1>Welcome to SecretSync</h1>
        <p className="muted">No admin account exists yet. Create the first Admin to finish setup.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="username">Admin username</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password (min 8 characters)</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Admin account'}
          </button>
        </form>
      </div>
    </div>
  );
}
