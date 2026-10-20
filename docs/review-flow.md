# Change review flow (protected branches)

## Lifecycle

- Writing to a protected branch creates a `proposal` (status `pending`) instead of touching `env_vars` directly. Writing to an unprotected branch applies immediately (`POST /api/projects/:projectId/env/:branchId`).
- A proposal bundles one or more changes, each `add` / `update` / `delete` against a single key.
- A proposal resolves to exactly one of: `pending` -> `approved` or `pending` -> `rejected`. Once resolved, no further reviews are accepted (`proposalService.review` throws if `status !== 'pending'`).

## Reviewer eligibility

- The proposer can never review their own proposal, regardless of reviewer-list settings.
- If the branch has no reviewer restriction, any member of the branch's project (other than the proposer) is eligible.
- If the branch has a reviewer restriction, only users on that list (other than the proposer) are eligible.
- Ineligible review attempts return 403 (`ForbiddenError`).

## Approval counting

- Approval count is re-read from the database after each review is recorded, not tracked in memory, so concurrent reviews can't produce a stale count.
- A single `reject` immediately resolves the proposal as `rejected`, regardless of how many approvals already exist. There's no "undo" or re-open.
- Once approvals >= the branch's `required_approvals`, the proposal is resolved `approved` and its changes are applied to `env_vars` in one transaction.

## Where this surfaces in the UI

- `ReviewPage.jsx`: "needs your review" queue (`GET /api/proposals/pending`) - pending proposals in the reviewer's projects, excluding their own proposals and branches they've already reviewed.
- Dashboard shows a count badge for the same queue.
- Each pending proposal shows a running approval count and lets the reviewer approve/reject with an optional comment (max 500 characters).

## Admins and the pending queue

- Admins see pending proposals for every project, even if they were never added as a member of that project (`proposalRepository.listPendingForReviewer` checks `role === 'admin'` as an alternative to an actual membership row).
- A plain member only sees proposals for projects they're an explicit member of. Creating a member/admin account does not add them to any project; that's a separate step (see `rbac.md`).
