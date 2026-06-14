#!/bin/sh
set -e

echo "[api] Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "[api] migrate deploy failed — retrying after repair..." >&2
  node scripts/repair-migration-history.mjs
fi

if [ "${SEED_DATABASE:-}" = "true" ]; then
  if [ "${ALLOW_LOCAL_SEED:-}" != "true" ]; then
    echo "[api] SEED_DATABASE ignored — seed only runs locally (ALLOW_LOCAL_SEED=true in Docker Compose)."
  else
    echo "[api] SEED_DATABASE=true — running seed (wipes users)..."
    npx prisma db seed
  fi
else
  echo "[api] Skipping seed (set SEED_DATABASE=true in .env for local Docker only)."
fi

echo "[api] Syncing project catalog..."
npx tsx src/server/bootstrap-projects.ts

if [ "${ENSURE_DEFAULT_ADMIN:-true}" != "false" ]; then
  echo "[api] Ensuring default admin account..."
  npx tsx src/server/ensure-default-admin.ts
fi

echo "[api] Starting server..."
exec npm run start:api
