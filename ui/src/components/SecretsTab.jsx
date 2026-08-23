import { useEffect, useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import {
  addSecret,
  deleteSecret,
  getCliPullCommand,
  listSecrets,
  revealSecret,
} from '../lib/api-stubs';

function maskValue(length = 24) {
  return '•'.repeat(Math.min(Math.max(length, 10), 40));
}

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = await getText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable; ignore silently in this stubbed UI.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      onClick={handleCopy}
      className="cursor-pointer rounded p-1.5 text-text-dim transition-colors hover:bg-bg-hover hover:text-text-bright"
      title="Copy value"
    >
      {copied ? (
        <span className="text-[10px] font-medium text-accent">copied</span>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3 10.5V3.5A1.5 1.5 0 0 1 4.5 2h7" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )}
    </button>
  );
}

function SecretRow({ secret, projectId, envId, canEdit, onDelete }) {
  const [revealed, setRevealed] = useState(false);
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleToggleReveal() {
    if (!revealed && value === null) {
      setLoading(true);
      try {
        const plaintext = await revealSecret(projectId, envId, secret.id);
        setValue(plaintext);
      } finally {
        setLoading(false);
      }
    }
    setRevealed((prev) => !prev);
  }

  async function getValueForCopy() {
    if (value !== null) return value;
    const plaintext = await revealSecret(projectId, envId, secret.id);
    setValue(plaintext);
    return plaintext;
  }

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2.5 pr-4 font-mono text-sm text-text-bright">{secret.key}</td>
      <td className="py-2.5 pr-4 font-mono text-sm text-text">
        <span className={revealed ? 'text-text-bright' : 'text-text-dim'}>
          {loading ? 'decrypting…' : revealed ? value : maskValue(secret.key.length + 8)}
        </span>
      </td>
      <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-text-dim">
        {new Date(secret.updatedAt).toLocaleDateString()}
      </td>
      <td className="py-2.5 text-right">
        <div className="flex justify-end gap-1">
          <button
            onClick={handleToggleReveal}
            className="cursor-pointer rounded p-1.5 text-text-dim transition-colors hover:bg-bg-hover hover:text-text-bright"
            title={revealed ? 'Hide value' : 'Reveal value'}
          >
            {revealed ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3" />
                <path d="M3 13 13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            )}
          </button>
          <CopyButton getText={getValueForCopy} />
          {canEdit && (
            <button
              onClick={() => onDelete(secret.id)}
              className="cursor-pointer rounded p-1.5 text-text-dim transition-colors hover:bg-danger-bg hover:text-danger"
              title="Delete variable"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5V13a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function SecretsTab({ project, env, canEdit }) {
  const [secrets, setSecrets] = useState(null);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSecrets(null);
    listSecrets(project.id, env.id).then(setSecrets);
  }, [project.id, env.id]);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmedKey = key.trim().toUpperCase();
    if (!trimmedKey) {
      setError('Key is required.');
      return;
    }
    if (!/^[A-Z_][A-Z0-9_]*$/.test(trimmedKey)) {
      setError('Keys should look like ENV_VAR_NAME (letters, numbers, underscores).');
      return;
    }
    if (!value) {
      setError('Value is required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const secret = await addSecret(project.id, env.id, trimmedKey, value);
      setSecrets((prev) => [...(prev ?? []), secret]);
      setKey('');
      setValue('');
    } catch (err) {
      setError(err.message ?? 'Could not add the variable.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(secretId) {
    setSecrets((prev) => prev.filter((s) => s.id !== secretId));
    await deleteSecret(project.id, env.id, secretId);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-md border border-border bg-bg-panel px-3 py-2 font-mono text-xs text-text-dim">
        <span className="text-accent">$</span>
        <span className="select-all text-text">{getCliPullCommand(project.name, env.name)}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-bg-panel text-xs uppercase tracking-wide text-text-dim">
              <th className="px-4 py-2 font-medium">Key</th>
              <th className="px-4 py-2 font-medium">Value</th>
              <th className="px-4 py-2 font-medium">Updated</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="px-4">
            {secrets === null && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-text-dim">
                  Loading secrets…
                </td>
              </tr>
            )}
            {secrets && secrets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-text-dim">
                  No variables in this environment yet.
                </td>
              </tr>
            )}
            {secrets &&
              secrets.map((secret) => (
                <SecretRow
                  key={secret.id}
                  secret={secret}
                  projectId={project.id}
                  envId={env.id}
                  canEdit={canEdit}
                  onDelete={handleDelete}
                />
              ))}
          </tbody>
        </table>
        {secrets && (
          <div className="border-t border-border px-4 py-2 text-[11px] text-text-dim">
            {secrets.length} variable{secrets.length === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {canEdit && (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-lg border border-border bg-bg-panel p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              label="Key"
              name="key"
              mono
              placeholder="API_KEY"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <div className="flex-[2]">
            <Input
              label="Value"
              name="value"
              mono
              placeholder="secret value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={submitting} className="shrink-0">
            {submitting ? 'Adding…' : 'Add variable'}
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
