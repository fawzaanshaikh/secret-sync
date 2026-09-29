import { branchRepository } from '../repositories/branchRepository.js';
import { proposalRepository } from '../repositories/proposalRepository.js';
import { envVarRepository } from '../repositories/envVarRepository.js';

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.status = 403;
  }
}

export const proposalService = {
  createProposal({ branchId, proposedBy, changes }) {
    return proposalRepository.create({ branchId, proposedBy, changes });
  },

  canReview(branch, proposal, reviewer) {
    if (proposal.proposed_by === reviewer.id) return false;
    const restrictedList = branchRepository.listReviewers(branch.id);
    if (restrictedList.length === 0) return true; // no restriction: any project member may review
    return restrictedList.some((r) => r.id === reviewer.id);
  },

  review({ proposalId, reviewer, decision, comment }) {
    const proposal = proposalRepository.findById(proposalId);
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.status !== 'pending') throw new Error('Proposal already resolved');

    const branch = branchRepository.findById(proposal.branch_id);
    if (!this.canReview(branch, proposal, reviewer)) {
      throw new ForbiddenError('Not eligible to review this proposal');
    }

    proposalRepository.addReview(proposalId, { reviewerId: reviewer.id, decision, comment });

    if (decision === 'reject') {
      proposalRepository.resolve(proposalId, 'rejected');
      return proposalRepository.findById(proposalId);
    }

    const updated = proposalRepository.findById(proposalId);
    const approvals = updated.reviews.filter((r) => r.decision === 'approve').length;

    if (approvals >= branch.required_approvals) {
      envVarRepository.applyChanges(branch.id, updated.changes, reviewer.id);
      proposalRepository.resolve(proposalId, 'approved');
    }

    return proposalRepository.findById(proposalId);
  },
};

export { ForbiddenError };
