import { freshDb } from './setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { userRepository } from '../src/repositories/userRepository.js';
import { projectRepository } from '../src/repositories/projectRepository.js';
import { branchRepository } from '../src/repositories/branchRepository.js';
import { envVarRepository } from '../src/repositories/envVarRepository.js';
import { proposalService, ForbiddenError } from '../src/services/proposalService.js';

beforeEach(async () => {
  await freshDb();
});

function makeUser(username, role) {
  return userRepository.create({ username, passwordHash: 'x', role });
}

function makeProtectedBranch(requiredApprovals = 1) {
  const admin = makeUser(`admin-${Date.now()}-${Math.random()}`, 'admin');
  const project = projectRepository.create({ name: `proj-${Date.now()}-${Math.random()}`, createdBy: admin.id });
  const branch = branchRepository.create({
    projectId: project.id,
    name: 'main',
    isProtected: true,
    requiredApprovals,
  });
  return { admin, project, branch };
}

test('proposer cannot approve their own proposal', () => {
  const { admin, branch } = makeProtectedBranch();
  const proposal = proposalService.createProposal({
    branchId: branch.id,
    proposedBy: admin.id,
    changes: [{ key: 'FOO', action: 'add', newValue: 'bar' }],
  });

  assert.throws(
    () => proposalService.review({ proposalId: proposal.id, reviewer: admin, decision: 'approve' }),
    ForbiddenError
  );
});

test('proposal applies to env_vars once required approvals reached', () => {
  const { admin, project, branch } = makeProtectedBranch(1);
  const reviewer = makeUser(`rev-${Date.now()}`, 'member');
  projectRepository.addMember(project.id, reviewer.id);

  const proposal = proposalService.createProposal({
    branchId: branch.id,
    proposedBy: admin.id,
    changes: [{ key: 'API_KEY', action: 'add', newValue: 'secret123' }],
  });

  assert.equal(envVarRepository.listForBranch(branch.id).length, 0);

  const resolved = proposalService.review({
    proposalId: proposal.id,
    reviewer,
    decision: 'approve',
  });

  assert.equal(resolved.status, 'approved');
  const vars = envVarRepository.listForBranch(branch.id);
  assert.equal(vars.length, 1);
  assert.equal(vars[0].value, 'secret123');
});

test('proposal requiring 2 approvals stays pending after 1', () => {
  const { admin, project, branch } = makeProtectedBranch(2);
  const reviewer1 = makeUser(`rev1-${Date.now()}`, 'member');
  projectRepository.addMember(project.id, reviewer1.id);

  const proposal = proposalService.createProposal({
    branchId: branch.id,
    proposedBy: admin.id,
    changes: [{ key: 'X', action: 'add', newValue: 'y' }],
  });

  const afterFirst = proposalService.review({ proposalId: proposal.id, reviewer: reviewer1, decision: 'approve' });
  assert.equal(afterFirst.status, 'pending');
  assert.equal(envVarRepository.listForBranch(branch.id).length, 0);
});

test('a single rejection resolves the proposal as rejected, regardless of approvals', () => {
  const { admin, project, branch } = makeProtectedBranch(1);
  const reviewer = makeUser(`rev-${Date.now()}`, 'member');
  projectRepository.addMember(project.id, reviewer.id);

  const proposal = proposalService.createProposal({
    branchId: branch.id,
    proposedBy: admin.id,
    changes: [{ key: 'X', action: 'add', newValue: 'y' }],
  });

  const resolved = proposalService.review({ proposalId: proposal.id, reviewer, decision: 'reject' });
  assert.equal(resolved.status, 'rejected');
  assert.equal(envVarRepository.listForBranch(branch.id).length, 0);
});

test('branch with a restricted reviewer list blocks non-listed reviewers', () => {
  const { admin, project, branch } = makeProtectedBranch(1);
  const allowedReviewer = makeUser(`allowed-${Date.now()}`, 'member');
  const otherMember = makeUser(`other-${Date.now()}`, 'member');
  projectRepository.addMember(project.id, allowedReviewer.id);
  projectRepository.addMember(project.id, otherMember.id);
  branchRepository.setReviewers(branch.id, [allowedReviewer.id]);

  const proposal = proposalService.createProposal({
    branchId: branch.id,
    proposedBy: admin.id,
    changes: [{ key: 'X', action: 'add', newValue: 'y' }],
  });

  assert.throws(
    () => proposalService.review({ proposalId: proposal.id, reviewer: otherMember, decision: 'approve' }),
    ForbiddenError
  );

  const resolved = proposalService.review({ proposalId: proposal.id, reviewer: allowedReviewer, decision: 'approve' });
  assert.equal(resolved.status, 'approved');
});
