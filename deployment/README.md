# Local deployment

Scripts that install, build, and run both `server/` and `ui/` on a single machine,
without a dev watcher. Use these when you just want SecretSync running, not for development
(use the root `README.md` for that).

Requires Node.js 18+ and npm, same as the rest of the repo.

## Linux / macOS

```
deployment/linux/deploy.sh
```

- Installs backend and frontend dependencies.
- Creates `server/.env` with freshly generated `JWT_SECRET`/`ENCRYPTION_KEY` if it does not exist yet.
- Creates `ui/.env.local` from `ui/.env.example` if it does not exist yet.
- Builds the frontend (`ui/dist`) and starts both backend and frontend preview server in the background.

Stop everything:

```
deployment/linux/stop.sh
```

## Windows

Double-click `deployment\windows\deploy.bat` (or run it from `cmd`/PowerShell). Same steps
as the Linux script. Stop with `deployment\windows\stop.bat`.

The `.bat` files are wrappers that call the underlying `deploy.ps1`/`stop.ps1` with a
one-off execution-policy bypass, so nobody has to change PowerShell's system execution
policy just to run this. If you prefer calling the `.ps1` files directly from PowerShell,
you may hit `running scripts is disabled on this system`; either use the `.bat` files
instead, or run `powershell -ExecutionPolicy Bypass -File deployment\windows\deploy.ps1`.

## Notes

- Default ports: backend `4000`, frontend `5173`. Override the frontend port with the `UI_PORT`
  environment variable before running `deploy.sh` / `deploy.ps1`.
- Logs and pid files are written to `deployment/.run/` (gitignored), one pair per process.
- Re-running `deploy.sh` / `deploy.ps1` does not overwrite an existing `.env` or `.env.local`,
  so it is safe to re-run after a `git pull` to pick up new dependencies.
- For running as a shared server on a LAN, or local-only without building, see the root `README.md`.
