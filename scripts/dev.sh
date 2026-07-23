#!/usr/bin/env bash
# Local dev with hot reload — no docker image rebuilds.
#
# Infra (Postgres + Mailpit) stays in docker; the web and API run on the HOST
# with HMR on the usual ports (web :3003, api :3001). Edit src/ and changes show
# up immediately — no `docker compose build` cycle. Ctrl+C stops both; run
# `docker compose up -d web api` afterwards to go back to the prod-like build.
set -e
cd "$(dirname "$0")/.."

echo "[dev] starting infra (db, mailpit)…"
docker compose up -d db mailpit

echo "[dev] freeing :3003/:3001 (stopping docker web+api)…"
docker compose stop web api 2>/dev/null || true

# Reuse the project's JWT secret so tokens stay valid across docker/host runs.
JWT_FROM_ENV=$(grep -E '^JWT_SECRET=' .env 2>/dev/null | head -1 | cut -d= -f2-)

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ccdle?schema=public"
export JWT_SECRET="${JWT_FROM_ENV:-dev-secret-change-me}"
export PORT=3001
export CORS_ORIGIN="http://localhost:3003"
export APP_URL="http://localhost:3003"
export SMTP_HOST=localhost
export SMTP_PORT=1025
export ENSURE_DEFAULT_ADMIN=true
export ALLOW_LOCAL_SEED=true
# Browser talks to the host API directly.
export NEXT_PUBLIC_API_URL="http://localhost:3001"

echo "[dev] applying migrations…"
npx prisma migrate deploy

echo "[dev] api → http://localhost:3001  |  web → http://localhost:3003"
npx tsx watch src/backend/index.ts &
API_PID=$!
trap 'kill $API_PID 2>/dev/null || true' EXIT INT TERM

npx next dev -p 3003
