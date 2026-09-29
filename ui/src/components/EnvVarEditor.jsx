import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Tracks uncommitted edits as a map keyed by env var key, diffed against the
// last-fetched server state, so "Save changes" submits only what actually changed.
export function EnvVarEditor({ projectId, branch, canWrite }) {
  const [vars, setVars] = useState([]);
  const [revealed, setRevealed] = useState({});
  const [edits, setEdits] = useState({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEdits({});
    setStatus(null);
    setError('');
    setLoading(true);
    api
      .listEnvVars(projectId, branch.id)
      .then(setVars)
      .finally(() => setLoading(false));
  }, [projectId, branch.id]);

  function visibleRows() {
    const rows = vars.map((v) => ({
      key: v.key,
      value: edits[v.key]?.action === 'update' ? edits[v.key].newValue : v.value,
      deleted: edits[v.key]?.action === 'delete',
      isNew: false,
    }));
    for (const [key, edit] of Object.entries(edits)) {
      if (edit.action === 'add') rows.push({ key, value: edit.newValue, deleted: false, isNew: true });
    }
    return rows;
  }

  function updateValue(key, value, isNew) {
    setEdits((prev) => ({ ...prev, [key]: { action: isNew ? 'add' : 'update', newValue: value } }));
  }

  function toggleDelete(key, isNew) {
    if (isNew) {
      setEdits((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    setEdits((prev) => ({ ...prev, [key]: { action: 'delete' } }));
  }

  function addRow(e) {
    e.preventDefault();
    if (!newKey) return;
    setEdits((prev) => ({ ...prev, [newKey]: { action: 'add', newValue: newValue } }));
    setNewKey('');
    setNewValue('');
  }

  async function handleSave() {
    setError('');
    const changes = Object.entries(edits).map(([key, edit]) => ({
      key,
      action: edit.action,
      ...(edit.action !== 'delete' ? { newValue: edit.newValue } : {}),
    }));
    if (changes.length === 0) return;

    try {
      const result = await api.submitEnvChanges(projectId, branch.id, changes);
      if (branch.is_protected) {
        setStatus(`Proposal #${result.proposal.id} submitted, awaiting review.`);
      } else {
        setVars(result);
        setStatus('Changes applied.');
      }
      setEdits({});
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading env vars…</p>;

  const rows = visibleRows();
  const dirty = Object.keys(edits).length > 0;

  return (
    <div>
      {branch.is_protected && (
        <p className="muted">
          <span className="badge badge-protected">protected</span> Changes here go through a review proposal
          ({branch.required_approvals} approval{branch.required_approvals === 1 ? '' : 's'} required) instead of
          applying directly.
        </p>
      )}

      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} style={row.deleted ? { opacity: 0.5, textDecoration: 'line-through' } : undefined}>
              <td className="mono">{row.key}</td>
              <td className="mono">
                {canWrite && !row.deleted ? (
                  <input
                    className="input"
                    type={revealed[row.key] ? 'text' : 'password'}
                    value={row.value}
                    onChange={(e) => updateValue(row.key, e.target.value, row.isNew)}
                  />
                ) : revealed[row.key] ? (
                  row.value
                ) : (
                  '••••••••'
                )}
              </td>
              <td>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setRevealed((r) => ({ ...r, [row.key]: !r[row.key] }))}
                >
                  {revealed[row.key] ? 'Hide' : 'Reveal'}
                </button>
                {canWrite && !row.deleted && (
                  <button type="button" className="btn btn-danger" style={{ marginLeft: 8 }} onClick={() => toggleDelete(row.key, row.isNew)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={3} className="muted">No env vars on this branch yet.</td></tr>
          )}
        </tbody>
      </table>

      {canWrite && (
        <form onSubmit={addRow} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input className="input mono" placeholder="KEY" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
          <input className="input mono" placeholder="value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
          <button type="submit" className="btn">Add</button>
        </form>
      )}

      {canWrite && (
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-primary" disabled={!dirty} onClick={handleSave}>
            {branch.is_protected ? 'Submit for review' : 'Save changes'}
          </button>
        </div>
      )}

      {status && <p className="muted" style={{ marginTop: 8 }}>{status}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
