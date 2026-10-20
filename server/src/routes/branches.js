import { Router } from 'express';
import { z } from 'zod';
import { branchRepository } from '../repositories/branchRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { requireProjectMember } from '../middleware/projectAccess.js';

const router = Router({ mergeParams: true });

// Largest requiredApprovals that can ever be satisfied: the proposer is always
// excluded from reviewing their own proposal, so the pool is reviewers-minus-one.
function maxPossibleApprovals(projectId, branchId) {
  const restrictedList = branchRepository.listReviewers(branchId);
  const pool = restrictedList.length > 0
    ? restrictedList.length
    : projectRepository.listMembers(projectId).length;
  return Math.max(pool - 1, 0);
}

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

  const projectId = Number(req.params.projectId);
  const branchId = Number(req.params.branchId);

  if (parsed.data.isProtected) {
    const maxApprovals = maxPossibleApprovals(projectId, branchId);
    if (maxApprovals < 1) {
      return res.status(400).json({
        error: 'Not enough eligible reviewers to protect this branch. Add at least one more member or reviewer first.',
      });
    }
    if (parsed.data.requiredApprovals > maxApprovals) {
      return res.status(400).json({
        error: `Required approvals cannot exceed ${maxApprovals} (eligible reviewers minus the proposer).`,
      });
    }
  }

  const branch = branchRepository.updateProtection(branchId, parsed.data);
  res.json(branch);
});

router.put('/:branchId/reviewers', requireAuth, requireAdmin, (req, res) => {
  const parsed = z.object({ userIds: z.array(z.number().int()) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const projectId = Number(req.params.projectId);
  const branchId = Number(req.params.branchId);
  const branch = branchRepository.findById(branchId);

  if (branch.is_protected && parsed.data.userIds.length > 0) {
    const maxApprovals = Math.max(parsed.data.userIds.length - 1, 0);
    if (branch.required_approvals > maxApprovals) {
      return res.status(400).json({
        error: `This reviewer list only supports up to ${maxApprovals} required approval(s), but the branch currently requires ${branch.required_approvals}. Lower required approvals first.`,
      });
    }
  }

  branchRepository.setReviewers(branchId, parsed.data.userIds);
  res.json(branchRepository.listReviewers(branchId));
});

export default router;
