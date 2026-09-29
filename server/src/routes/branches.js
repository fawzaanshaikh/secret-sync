import { Router } from 'express';
import { z } from 'zod';
import { branchRepository } from '../repositories/branchRepository.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { requireProjectMember } from '../middleware/projectAccess.js';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, requireProjectMember, (req, res) => {
  const parsed = z.object({ name: z.string().min(1).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const branch = branchRepository.create({
    projectId: Number(req.params.projectId),
    name: parsed.data.name,
  });
  res.status(201).json(branch);
});

router.patch('/:branchId/protection', requireAuth, requireAdmin, (req, res) => {
  const parsed = z
    .object({ isProtected: z.boolean(), requiredApprovals: z.number().int().min(1).max(10) })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const branch = branchRepository.updateProtection(Number(req.params.branchId), parsed.data);
  res.json(branch);
});

router.put('/:branchId/reviewers', requireAuth, requireAdmin, (req, res) => {
  const parsed = z.object({ userIds: z.array(z.number().int()) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  branchRepository.setReviewers(Number(req.params.branchId), parsed.data.userIds);
  res.json(branchRepository.listReviewers(Number(req.params.branchId)));
});

export default router;
