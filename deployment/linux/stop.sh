#!/usr/bin/env bash
# Stops the backend and frontend processes started by deploy.sh.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT_DIR/deployment/.run"

stop_pid_file() {
  local name="$1"
  local pid_file="$RUN_DIR/$name.pid"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      echo "Stopped $name (pid $pid)"
    else
      echo "$name was not running"
    fi
    rm -f "$pid_file"
  else
    echo "No pid file for $name, nothing to stop"
  fi
}

stop_pid_file backend
stop_pid_file frontend
