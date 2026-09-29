import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EnvVarEditor } from '../components/EnvVarEditor.jsx';

export function ProjectPage() {
  const { projectId } = useParams();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [activeBranchId, setActiveBranchId] = useState(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await api.getProject(projectId);
    setProject(data);
    setActiveBranchId((current) => current ?? data.branches[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleCreateBranch(e) {
    e.preventDefault();
    setError('');
    try {
      const branch = await api.createBranch(projectId, newBranchName);
      setNewBranchName('');
      await refresh();
      setActiveBranchId(branch.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleProtection(branch) {
    try {
      await api.updateBranchProtection(projectId, branch.id, {
        isProtected: !branch.is_protected,
        requiredApprovals: branch.required_approvals,
      });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApprovalsChange(branch, value) {
    try {
      await api.updateBranchProtection(projectId, branch.id, {
        isProtected: Boolean(branch.is_protected),
        requiredApprovals: Number(value),
      });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!project) return <p className="error-text">{error}</p>;

  const activeBranch = project.branches.find((b) => b.id === activeBranchId);

  return (
    <div>
      <h1>{project.name}</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Branches</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {project.branches.map((b) => (
            <button
              key={b.id}
              type="button"
              className="btn"
              style={b.id === activeBranchId ? { borderColor: 'var(--color-primary)' } : undefined}
              onClick={() => setActiveBranchId(b.id)}
            >
              {b.name} {Boolean(b.is_protected) && <span className="badge badge-protected" style={{ marginLeft: 6 }}>protected</span>}
            </button>
          ))}
        </div>

        {isAdmin && (
          <form onSubmit={handleCreateBranch} style={{ display: 'flex', gap: 8 }}>
            <input
              className="input mono"
              placeholder="branch-name"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              required
            />
            <button type="submit" className="btn">Add branch</button>
          </form>
        )}
      </div>

      {activeBranch && isAdmin && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Branch settings: {activeBranch.name}</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={Boolean(activeBranch.is_protected)}
              onChange={() => handleToggleProtection(activeBranch)}
            />
            Protected (require review before changes apply)
          </label>
          {Boolean(activeBranch.is_protected) && (
            <div className="form-row" style={{ maxWidth: 200, marginTop: 12 }}>
              <label htmlFor="approvals">Required approvals</label>
              <input
                id="approvals"
                type="number"
                min={1}
                max={10}
                className="input"
                value={activeBranch.required_approvals}
                onChange={(e) => handleApprovalsChange(activeBranch, e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {activeBranch && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Env vars: {activeBranch.name}</h3>
          <EnvVarEditor projectId={projectId} branch={activeBranch} canWrite />
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Members</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {project.members.map((m) => (
            <li key={m.id}>{m.username} <span className="muted">({m.role})</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
