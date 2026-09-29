import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function ChangeRow({ change }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <tr>
      <td className="mono">{change.key}</td>
      <td><span className={`badge badge-${change.action === 'delete' ? 'rejected' : change.action === 'add' ? 'approved' : 'pending'}`}>{change.action}</span></td>
      <td className="mono">
        {change.action === 'delete' ? (
          <span className="muted">n/a</span>
        ) : revealed ? (
          change.newValue
        ) : (
          '••••••••'
        )}
      </td>
      <td>
        {change.action !== 'delete' && (
          <button type="button" className="btn" onClick={() => setRevealed((r) => !r)}>
            {revealed ? 'Hide' : 'Reveal'}
          </button>
        )}
      </td>
    </tr>
  );
}

function ProposalCard({ proposal, onReviewed }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function decide(decision) {
    setError('');
    setSubmitting(true);
    try {
      await api.reviewProposal(proposal.id, decision, comment || undefined);
      onReviewed();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const approvals = proposal.reviews.filter((r) => r.decision === 'approve').length;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>Proposal #{proposal.id}</strong>
        <span className="muted">{new Date(proposal.created_at).toLocaleString()}</span>
      </div>

      <table style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Key</th><th>Action</th><th>New value</th><th /></tr>
        </thead>
        <tbody>
          {proposal.changes.map((c) => <ChangeRow key={c.id} change={c} />)}
        </tbody>
      </table>

      <p className="muted" style={{ marginTop: 8 }}>{approvals} approval{approvals === 1 ? '' : 's'} so far.</p>

      <div className="form-row">
        <label htmlFor={`comment-${proposal.id}`}>Comment (optional)</label>
        <input
          id={`comment-${proposal.id}`}
          className="input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => decide('approve')}>
          Approve
        </button>
        <button type="button" className="btn btn-danger" disabled={submitting} onClick={() => decide('reject')}>
          Reject
        </button>
      </div>
    </div>
  );
}

export function ReviewPage() {
  const [proposals, setProposals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setProposals(await api.listPendingProposals());
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1>Review queue</h1>
      {error && <p className="error-text">{error}</p>}
      {proposals.length === 0 && <p className="muted">Nothing awaiting your review.</p>}
      {proposals.map((p) => (
        <ProposalCard key={p.id} proposal={p} onReviewed={refresh} />
      ))}
    </div>
  );
}
