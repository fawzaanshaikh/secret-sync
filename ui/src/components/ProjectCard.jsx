import { Link } from 'react-router-dom';
import { RoleBadge } from './ui/Badge';

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-bg-panel p-5 transition-colors hover:border-accent-border"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-sm font-semibold text-text-bright group-hover:text-accent">
          {project.name}
        </h3>
        <RoleBadge role={project.role} />
      </div>
      <p className="line-clamp-2 text-sm text-text-dim">{project.description}</p>
    </Link>
  );
}
