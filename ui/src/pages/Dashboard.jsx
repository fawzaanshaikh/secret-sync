import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NewProjectModal from '../components/NewProjectModal';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/ui/Button';
import { createProject, listProjects } from '../lib/api-stubs';

export default function Dashboard() {
  const [projects, setProjects] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listProjects().then(setProjects);
  }, []);

  async function handleCreate({ name, description }) {
    const project = await createProject({ name, description });
    setProjects((prev) => [{ ...project }, ...(prev ?? [])]);
    navigate(`/projects/${project.id}`);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-bright">Projects</h1>
          <p className="mt-1 text-sm text-text-dim">
            Workspaces you belong to. Select one to manage its secrets.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <span className="text-base leading-none">+</span> New project
        </Button>
      </div>

      {projects === null && (
        <div className="text-sm text-text-dim">Loading projects…</div>
      )}

      {projects && projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-border-strong p-10 text-center text-sm text-text-dim">
          No projects yet. Create your first one to get started.
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
