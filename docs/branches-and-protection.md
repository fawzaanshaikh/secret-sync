# Branches and protection

## Creation

- Every new project gets a `main` branch automatically, created as **protected** with `requiredApprovals = 1` (`server/src/routes/projects.js`).
- Additional branches are created unprotected by default; an admin must explicitly turn protection on (`server/src/routes/branches.js`).
- Branch names: 1-100 characters, no other format constraints.

## Protection settings (admin only)

- `PATCH /api/projects/:projectId/branches/:branchId/protection` toggles `isProtected` and sets `requiredApprovals` together, in one call. The UI (`ProjectPage.jsx`, "Branch settings" card) exposes this as a checkbox + number input per branch.
- `requiredApprovals` range: integer 1-10.
- Unprotecting a branch does not retroactively affect proposals already resolved on it; it only changes how future `POST .../env/:branchId` calls are routed (direct apply vs proposal).

## Required approvals cannot exceed eligible reviewers

- The proposer is always excluded from reviewing their own proposal, so the maximum number of approvals that can ever actually be collected is one less than the pool of eligible reviewers.
- Eligible pool = the branch's restricted reviewer list if one is set, otherwise the project's member count.
- `PATCH .../protection` rejects (400) a `requiredApprovals` value above `max(pool - 1, 0)` when `isProtected: true`. If the pool is too small to support even 1 approval (e.g. a 1-member project), protecting the branch at all is rejected until more members/reviewers are added.
- `PUT .../reviewers` rejects (400) a reviewer list that's too small for the branch's current `requiredApprovals` (e.g. setting `requiredApprovals: 2` then later restricting the list to a single reviewer). Lower `requiredApprovals` first if you need to shrink the list below that.
- This check runs server-side only; the UI shows whatever error message comes back (no client-side pre-validation/clamping on the number input yet).
