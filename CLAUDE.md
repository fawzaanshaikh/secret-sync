# SecretSync

A self-hostable, zero-knowledge tool for dev teams to share environment variables / .env files. The server only ever stores ciphertext; all encryption/decryption happens client-side.

## Repo layout

- `ui/` — frontend (React + Vite + Tailwind + react-router-dom). Self-contained Vite project: `cd ui && npm install && npm run dev`.
- `logic/` — backend/server code.
- `docs/` — documentation of app features.
- `plans/` — planning docs.
- `misc/` — miscellaneous docs that don't fit elsewhere.

## Writing style

Never use em-dashes (—) anywhere: not in code comments, docs, commit messages, or any generated text. Use a period, comma, or parentheses instead.

## Frontend notes

- All backend/API and crypto calls in `ui/` go through stub functions isolated in `ui/src/lib/api-stubs.js` (clearly named, e.g. `loginUser`, `encryptValue`) that return realistic mock data. Do not implement real auth, encryption, or networking in `ui/` — that's implemented separately in `logic/`.
