import { Router } from 'express';
import { z } from 'zod';
import { branchRepository } from '../repositories/branchRepository.js';
import { envVarRepository } from '../repositories/envVarRepository.js';
import { proposalService } from '../services/proposalService.js';
import { requireAuth } from '../middleware/auth.js';
import { requireProjectMember } from '../middleware/projectAccess.js';

const router = Router({ mergeParams: true });

const changeSchema = z.array(
  z.object({
    key: z.string().min(1).max(200),
    action: z.enum(['add', 'update', 'delete']),
    newValue: z.string().optional(),
  })
);

router.get('/:branchId', requireAuth, requireProjectMember, (req, res) => {
  res.json(envVarRepository.listForBranch(Number(req.params.branchId)));
});

// Applies (unprotected branch) or proposes (protected branch) a batch of key changes.
router.post('/:branchId', requireAuth, requireProjectMember, (req, res) => {
  const parsed = changeSchema.safeParse(req.body.changes);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const branch = branchRepository.findById(Number(req.params.branchId));
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  if (branch.is_protected) {
    const proposal = proposalService.createProposal({
      branchId: branch.id,
      proposedBy: req.user.id,
      changes: parsed.data,
    });
    return res.status(202).json({ proposal });
  }

  envVarRepository.applyChanges(branch.id, parsed.data, req.user.id);
  return res.status(200).json(envVarRepository.listForBranch(branch.id));
});

export default router;
