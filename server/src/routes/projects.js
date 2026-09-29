import { Router } from 'express';
import { z } from 'zod';
import { projectRepository } from '../repositories/projectRepository.js';
import { branchRepository } from '../repositories/branchRepository.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { requireProjectMember } from '../middleware/projectAccess.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  res.json(projectRepository.listForUser(req.user.id, req.user.role));
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const parsed = z.object({ name: z.string().min(1).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const project = projectRepository.create({ name: parsed.data.name, createdBy: req.user.id });
  branchRepository.create({ projectId: project.id, name: 'main', isProtected: true, requiredApprovals: 1 });
  res.status(201).json(project);
});

router.get('/:projectId', requireAuth, requireProjectMember, (req, res) => {
  const project = projectRepository.findById(Number(req.params.projectId));
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({
    ...project,
    members: projectRepository.listMembers(project.id),
    branches: branchRepository.listForProject(project.id),
  });
});

router.post('/:projectId/members', requireAuth, requireAdmin, (req, res) => {
  const parsed = z.object({ userId: z.number().int() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  projectRepository.addMember(Number(req.params.projectId), parsed.data.userId);
  res.status(204).end();
});

router.delete('/:projectId/members/:userId', requireAuth, requireAdmin, (req, res) => {
  projectRepository.removeMember(Number(req.params.projectId), Number(req.params.userId));
  res.status(204).end();
});

export default router;
