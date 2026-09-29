import { projectRepository } from '../repositories/projectRepository.js';

export function requireProjectMember(req, res, next) {
  const projectId = Number(req.params.projectId);
  if (req.user.role === 'admin') return next(); // admins bypass membership checks
  if (!projectRepository.isMember(projectId, req.user.id)) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  next();
}
