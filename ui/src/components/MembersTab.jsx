import { useEffect, useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import {
  inviteMember,
  listMembers,
  removeMember,
  setProdAccess,
  updateMemberRole,
} from '../lib/api-stubs';

const ROLES = ['viewer', 'editor', 'admin'];

function ProdToggle({ enabled, disabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative h-5 w-9 cursor-pointer rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        enabled ? 'border-accent-border bg-accent-bg' : 'border-border-strong bg-bg-hover'
      }`}
      title="Toggle production access"
    >
      <span
        className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-transform ${
          enabled ? 'translate-x-[18px] bg-accent' : 'translate-x-0.5 bg-text-dim'
        }`}
      />
    </button>
  );
}

export default function MembersTab({ project, isAdmin, currentUserEmail }) {
  const [members, setMembers] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listMembers(project.id).then(setMembers);
  }, [project.id]);

  async function handleInvite(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === trimmed.toLowerCase())) {
      setError('This person is already a member.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const member = await inviteMember(project.id, trimmed, role);
      setMembers((prev) => [...prev, member]);
      setEmail('');
      setRole('viewer');
    } catch (err) {
      setError(err.message ?? 'Could not send the invite.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(memberId, newRole) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    await updateMemberRole(project.id, memberId, newRole);
  }

  async function handleProdToggle(memberId, enabled) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, prodAccess: enabled } : m)));
    await setProdAccess(project.id, memberId, enabled);
  }

  async function handleRemove(memberId) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    await removeMember(project.id, memberId);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-bg-panel text-xs uppercase tracking-wide text-text-dim">
              <th className="px-4 py-2 font-medium">Member</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Prod access</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {members === null && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-text-dim">
                  Loading members…
                </td>
              </tr>
            )}
            {members &&
              members.map((member) => {
                const isSelf = member.email === currentUserEmail;
                return (
                  <tr key={member.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2.5">
                      <div className="text-sm text-text-bright">{member.name}</div>
                      <div className="font-mono text-xs text-text-dim">{member.email}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={member.role}
                        disabled={!isAdmin || isSelf}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="cursor-pointer rounded-md border border-border-strong bg-bg px-2 py-1 text-xs text-text-bright outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <ProdToggle
                        enabled={member.prodAccess}
                        disabled={!isAdmin}
                        onChange={(enabled) => handleProdToggle(member.id, enabled)}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isAdmin && !isSelf && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="cursor-pointer rounded p-1.5 text-text-dim transition-colors hover:bg-danger-bg hover:text-danger"
                          title="Remove member"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M4 4l8 8M12 4l-8 8"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <form
          onSubmit={handleInvite}
          className="flex flex-col gap-3 rounded-lg border border-border bg-bg-panel p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              label="Invite by email"
              name="inviteEmail"
              type="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-dim">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="cursor-pointer rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text-bright outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={submitting} className="shrink-0">
            {submitting ? 'Inviting…' : 'Send invite'}
          </Button>
        </form>
      )}
      {error && (
        <p className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
