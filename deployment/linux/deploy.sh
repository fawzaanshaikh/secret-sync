#!/usr/bin/env bash
# Local deployment: installs, builds, and starts both server and ui on one Linux machine.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT_DIR/deployment/.run"
SERVER_DIR="$ROOT_DIR/server"
UI_DIR="$ROOT_DIR/ui"
UI_PORT="${UI_PORT:-5173}"

mkdir -p "$RUN_DIR"

echo "==> Installing backend dependencies"
(cd "$SERVER_DIR" && npm install)

if [ ! -f "$SERVER_DIR/.env" ]; then
  echo "==> Creating server/.env with generated secrets"
  cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
  JWT_SECRET="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")"
  ENCRYPTION_KEY="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")"
  sed -i "s#^JWT_SECRET=.*#JWT_SECRET=$JWT_SECRET#" "$SERVER_DIR/.env"
  sed -i "s#^ENCRYPTION_KEY=.*#ENCRYPTION_KEY=$ENCRYPTION_KEY#" "$SERVER_DIR/.env"
else
  echo "==> server/.env already exists, leaving it as is"
fi

echo "==> Installing frontend dependencies"
(cd "$UI_DIR" && npm install)

if [ ! -f "$UI_DIR/.env.local" ]; then
  echo "==> Creating ui/.env.local pointing at the local backend"
  cp "$UI_DIR/.env.example" "$UI_DIR/.env.local"
else
  echo "==> ui/.env.local already exists, leaving it as is"
fi

echo "==> Building frontend"
(cd "$UI_DIR" && npm run build)

echo "==> Starting backend (background)"
(cd "$SERVER_DIR" && nohup node src/index.js > "$RUN_DIR/backend.log" 2>&1 &
 echo $! > "$RUN_DIR/backend.pid")

echo "==> Starting frontend preview server on port $UI_PORT (background)"
(cd "$UI_DIR" && nohup node node_modules/vite/bin/vite.js preview --port "$UI_PORT" --host > "$RUN_DIR/frontend.log" 2>&1 &
 echo $! > "$RUN_DIR/frontend.pid")

sleep 1

echo
echo "SecretSync is running."
echo "  Backend:  http://localhost:4000  (logs: $RUN_DIR/backend.log)"
echo "  Frontend: http://localhost:$UI_PORT  (logs: $RUN_DIR/frontend.log)"
echo
echo "Stop with: deployment/linux/stop.sh"
