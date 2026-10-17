# Session behavior

- Login/setup state (user object + token) is persisted in `localStorage` under `secretsync.auth`, so a page refresh keeps the user signed in.
- On app load, `AuthContext` reads that stored value synchronously before rendering protected routes, so there's a brief "checking" state rather than a flash of the login screen.
- If any API call gets back a `401` while a token is set, the client runs a single global "unauthorized" handler that logs the user out (clears the stored session and in-memory state) rather than leaving the app hung on a failed request. This covers the case where a token stops being valid after a backend redeploy or restart.
- `ProtectedRoute` resolves to one of three states for a visitor: still checking stored session, needs first-run setup (no users exist yet), or needs login. All protected pages route through this one component instead of each duplicating the check.
