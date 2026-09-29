import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export function DashboardPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [projectList, pending] = await Promise.all([api.listProjects(), api.listPendingProposals()]);
    setProjects(projectList);
    setPendingCount(pending.length);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  async function handleCreateProject(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createProject(newProjectName);
      setNewProjectName('');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1>Dashboard</h1>

      {pendingCount > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <span className="badge badge-pending">{pendingCount} pending</span>{' '}
          <Link to="/review">proposal{pendingCount === 1 ? '' : 's'} awaiting your review</Link>
        </div>
      )}

      {isAdmin && (
        <form onSubmit={handleCreateProject} className="card" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="new-project">New project</label>
            <input
              id="new-project"
              className="input"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="project-name"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      )}

      {error && <p className="error-text">{error}</p>}

      <div style={{ marginTop: 16 }}>
        {projects.length === 0 && <p className="muted">No projects yet.</p>}
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              <strong style={{ color: 'var(--color-text)' }}>{project.name}</strong>
              <div className="muted">Created {new Date(project.created_at).toLocaleDateString()}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
