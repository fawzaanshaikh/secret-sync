# SecretSync

Self-hosted environment variable sharing for dev teams, with per-branch RBAC and a GitHub-PR-style review flow for protected branches.

## Requirements

- Node.js 18+ (tested on 22)
- npm

## 1. Backend setup

```
cd server
npm install
cp .env.example .env
```

Edit `.env` and set real values for `JWT_SECRET` and `ENCRYPTION_KEY` (any long random strings). Do not use the example defaults outside local testing.

Start the backend:

```
npm run dev
```

This runs on `http://localhost:4000` by default, creates a local `data/secretsync.db` SQLite file, and applies migrations automatically on boot.

## 2. Frontend setup

In a second terminal:

```
cd ui
npm install
cp .env.example .env.local
npm run dev
```

This runs on `http://localhost:5173` and talks to the backend at the URL in `VITE_API_BASE` (`.env.local`).

## 3. First run

1. Open `http://localhost:5173` in a browser.
2. You will land on the setup screen (no users exist yet). Create the first Admin account.
3. As Admin: create a project (a protected `main` branch is created automatically), add other users via the Users page, and add them as project members.
4. Log in as a Member (in a different browser/incognito window, or after logging out) to try proposing a change on `main` and approving it from the Admin account.

## Running on a LAN (shared server mode)

1. Start the backend as above on the machine that will act as the shared server. Note that machine's LAN IP (e.g. `192.168.1.20`).
2. On every other machine, set `VITE_API_BASE=http://192.168.1.20:4000/api` in `ui/.env.local` before running the frontend, or point a built frontend at that URL.
3. All clients now read/write the same SQLite database on the host machine.

## Running fully offline / local-only

Just run the backend and frontend on the same machine as above. No internet connection is required; everything is stored in the local SQLite file.

## Tests

Backend:

```
cd server
npm test
```

Frontend:

```
cd ui
npm test
```

## Project structure

```
server/   Node/Express API, SQLite storage, RBAC and review-flow logic
ui/       React/Vite frontend
```

See `CLAUDE.md` (local, gitignored) for contribution conventions used with Claude Code, and `CONCEPT_SUMMARY.md` (local, gitignored) for a write-up of the concepts/patterns used throughout the codebase.
