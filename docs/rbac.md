# Roles and permissions

## Roles

- Two roles only: `admin` and `member`. No other role values are accepted (`server/src/routes/users.js`).
- First account created via `/api/auth/setup` is always `admin`. This endpoint self-disables once any user exists (`userRepository.countAll() > 0` returns 409) (`server/src/routes/auth.js`).
- Additional users (admin or member) are created by an existing admin via `POST /api/users` (`requireAdmin`).

## Project membership

- A project is only visible/usable by its members, except admins see and can act on every project regardless of membership (`projectRepository.listForUser`, `requireProjectMember` middleware bypass for `role === 'admin'`).
- Creating a project automatically adds the creator as a member (`projectRepository.create`).
- Admins add/remove members via `POST /api/projects/:projectId/members` and `DELETE /api/projects/:projectId/members/:userId`.

## What each role can do

- **Admin**: create projects, create/manage users, add/remove project members, toggle branch protection, set required approval count, restrict a branch's reviewer list, create branches, bypass membership checks on any project.
- **Member**: view/edit env vars on projects they're a member of (subject to branch protection), propose changes on protected branches, review/approve proposals they're eligible for.

## UI-level RBAC

- Admin-only controls (user management, branch settings, project creation) are hidden from members rather than shown-disabled, matching the server's hard 403 on those routes.
