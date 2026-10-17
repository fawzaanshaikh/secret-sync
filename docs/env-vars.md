# Env var editing

## Change format

- All edits (protected or not) are submitted as a batch: `changes: [{ key, action, newValue? }]` to `POST /api/projects/:projectId/env/:branchId`.
- `action` is one of `add`, `update`, `delete`. `newValue` is required for `add`/`update`, omitted for `delete`.
- Key: 1-200 characters. No charset restriction enforced server-side (not required to be a valid shell env var name).
- Routing is decided purely by `branch.is_protected`: unprotected -> applied immediately and the updated list is returned; protected -> wrapped in a proposal and `202` is returned with the proposal.

## Editor behavior (`EnvVarEditor.jsx`)

- Edits are held client-side in a map keyed by env var key, diffed against the last-fetched server state. Only changed keys are sent on save, not the full set.
- Re-adding a deleted-and-not-yet-saved new key simply removes it from the pending edit set (no "add then delete" round trip).
- Values default to masked (`type="password"` style display, `••••••••`) with a per-row "Reveal" toggle. This applies both to the live editor and to each change inside a pending proposal's diff view.
- Save button label reflects the branch type: "Save changes" (unprotected) vs "Submit for review" (protected), same component for both.
- A protected branch shows its current `requiredApprovals` inline above the editor so the author knows how many approvals the proposal will need.
