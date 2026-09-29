import { Router } from 'express';
import { z } from 'zod';
import { proposalRepository } from '../repositories/proposalRepository.js';
import { proposalService, ForbiddenError } from '../services/proposalService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Global "needs your review" queue, used by the Dashboard badge and Review screen.
router.get('/pending', requireAuth, (req, res) => {
  res.json(proposalRepository.listPendingForReviewer(req.user.id));
});

router.get('/branch/:branchId', requireAuth, (req, res) => {
  res.json(proposalRepository.listForBranch(Number(req.params.branchId), req.query.status));
});

router.get('/:proposalId', requireAuth, (req, res) => {
  const proposal = proposalRepository.findById(Number(req.params.proposalId));
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  res.json(proposal);
});

const reviewSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  comment: z.string().max(500).optional(),
});

router.post('/:proposalId/reviews', requireAuth, (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const proposal = proposalService.review({
      proposalId: Number(req.params.proposalId),
      reviewer: req.user,
      decision: parsed.data.decision,
      comment: parsed.data.comment,
    });
    res.json(proposal);
  } catch (err) {
    if (err instanceof ForbiddenError) return res.status(err.status).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
});

export default router;
