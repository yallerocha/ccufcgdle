#!/bin/sh
set -e

echo "[api] Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "[api] migrate deploy failed — retrying after repair..." >&2
  node scripts/repair-migration-history.mjs
fi

if [ "${SEED_DATABASE:-}" = "true" ]; then
  echo "[api] SEED_DATABASE=true — running seed (wipes users)..."
  npx prisma db seed
else
  echo "[api] Skipping seed (set SEED_DATABASE=true only for first deploy / dev)."
fi

echo "[api] Starting server..."
exec npm run start:api
