import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AuditLogTab from '../components/AuditLogTab';
import EnvironmentTabs from '../components/EnvironmentTabs';
import MembersTab from '../components/MembersTab';
import SecretsTab from '../components/SecretsTab';
import { RoleBadge } from '../components/ui/Badge';
import { createEnvironment, getProject } from '../lib/api-stubs';
import { useAuth } from '../lib/auth-context';

const SUB_TABS = [
  { id: 'secrets', label: 'Secrets' },
  { id: 'members', label: 'Members' },
  { id: 'audit', label: 'Audit log', adminOnly: true },
];

export default function ProjectView() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [activeEnvId, setActiveEnvId] = useState(null);
  const [activeTab, setActiveTab] = useState('secrets');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setProject(null);
    setNotFound(false);
    getProject(projectId)
      .then((p) => {
        setProject(p);
        setActiveEnvId(p.environments[0]?.id ?? null);
      })
      .catch(() => setNotFound(true));
  }, [projectId]);

  if (notFound) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong p-10 text-center text-sm text-text-dim">
        Project not found.{' '}
        <Link to="/" className="text-accent hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!project) {
    return <div className="text-sm text-text-dim">Loading project…</div>;
  }

  const isAdmin = project.role === 'admin';
  const canEditSecrets = project.role === 'admin' || project.role === 'editor';
  const activeEnv = project.environments.find((e) => e.id === activeEnvId) ?? project.environments[0];

  async function handleCreateEnv(name) {
    const env = await createEnvironment(project.id, name);
    setProject((prev) => ({ ...prev, environments: [...prev.environments, env] }));
    setActiveEnvId(env.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/" className="text-xs text-text-dim hover:text-text-bright">
          ← Projects
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-mono text-xl font-semibold text-text-bright">{project.name}</h1>
          <RoleBadge role={project.role} />
        </div>
        {project.description && (
          <p className="mt-1 text-sm text-text-dim">{project.description}</p>
        )}
      </div>

      <EnvironmentTabs
        environments={project.environments}
        activeEnvId={activeEnv?.id}
        onSelect={setActiveEnvId}
        canManage={isAdmin}
        onCreate={handleCreateEnv}
      />

      <div className="flex gap-1 border-b border-border">
        {SUB_TABS.filter((tab) => !tab.adminOnly || isAdmin).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-accent text-text-bright'
                : 'border-transparent text-text-dim hover:text-text-bright'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeEnv && activeTab === 'secrets' && (
        <SecretsTab project={project} env={activeEnv} canEdit={canEditSecrets} />
      )}
      {activeTab === 'members' && (
        <MembersTab project={project} isAdmin={isAdmin} currentUserEmail={user?.email} />
      )}
      {activeTab === 'audit' && isAdmin && <AuditLogTab project={project} />}
    </div>
  );
}
