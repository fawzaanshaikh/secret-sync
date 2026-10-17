# Branches and protection

## Creation

- Every new project gets a `main` branch automatically, created as **protected** with `requiredApprovals = 1` (`server/src/routes/projects.js`).
- Additional branches are created unprotected by default; an admin must explicitly turn protection on (`server/src/routes/branches.js`).
- Branch names: 1-100 characters, no other format constraints.

## Protection settings (admin only)

- `PATCH /api/projects/:projectId/branches/:branchId/protection` toggles `isProtected` and sets `requiredApprovals` together, in one call. The UI (`ProjectPage.jsx`, "Branch settings" card) exposes this as a checkbox + number input per branch.
- `requiredApprovals` range: integer 1-10.
- Unprotecting a branch does not retroactively affect proposals already resolved on it; it only changes how future `POST .../env/:branchId` calls are routed (direct apply vs proposal).

## Reviewer restriction (admin only)

- `PUT /api/projects/:projectId/branches/:branchId/reviewers` replaces the branch's reviewer allow-list in one transaction (full delete + reinsert, not a diff).
- Empty list = unrestricted: any project member other than the proposer may review.
- Non-empty list = only the listed users may review (still excluding the proposer themselves, even if listed).
- There is currently no dedicated UI page for managing this list; it's only reachable via the API (`api.setBranchReviewers` exists in `ui/src/api/client.js` but no page calls it yet).
