import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setUsers(await api.listUsers());
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createUser(form);
      setForm({ username: '', password: '', role: 'member' });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1>Users</h1>

      <form onSubmit={handleCreate} className="card">
        <h3 style={{ marginTop: 0 }}>Add user</h3>
        <div className="form-row">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary">Create user</button>
      </form>

      <div className="card">
        <table>
          <thead>
            <tr><th>Username</th><th>Role</th><th>Created</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-protected' : ''}`}>{u.role}</span></td>
                <td className="muted">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
