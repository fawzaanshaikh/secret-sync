import { useState } from 'react';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';

export default function EnvironmentTabs({ environments, activeEnvId, onSelect, canManage, onCreate }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function closeModal() {
    setModalOpen(false);
    setName('');
    setError('');
  }

  async function handleCreate(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Environment name is required.');
      return;
    }
    if (environments.some((env) => env.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('An environment with this name already exists.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreate(trimmed);
      closeModal();
    } catch (err) {
      setError(err.message ?? 'Could not create the environment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
      {environments.map((env) => {
        const active = env.id === activeEnvId;
        return (
          <button
            key={env.id}
            onClick={() => onSelect(env.id)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
              active
                ? env.sensitive
                  ? 'border-danger-border bg-danger-bg text-danger'
                  : 'border-accent-border bg-accent-bg text-accent'
                : 'border-border-strong text-text-dim hover:text-text-bright'
            }`}
          >
            {env.name}
            {env.sensitive && (
              <Badge tone={active ? 'danger' : 'neutral'} className="px-1.5 py-0 text-[9px]">
                sensitive
              </Badge>
            )}
          </button>
        );
      })}
      {canManage && (
        <button
          onClick={() => setModalOpen(true)}
          className="cursor-pointer rounded-md border border-dashed border-border-strong px-3 py-1.5 text-xs font-medium text-text-dim hover:border-accent-border hover:text-accent"
        >
          + Add environment
        </button>
      )}

      <Modal open={modalOpen} onClose={closeModal} title="New environment" width="max-w-sm">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Environment name"
            name="envName"
            mono
            placeholder="staging"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {error && (
            <p className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Add environment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
