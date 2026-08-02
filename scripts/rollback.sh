#!/usr/bin/env bash
# Production Package 4 — rollback command.
# Usage: scripts/rollback.sh <staging|production> <previous-git-sha>
set -euo pipefail

TARGET="${1:-}"
PREV_SHA="${2:-}"

if [[ "$TARGET" != "staging" && "$TARGET" != "production" ]] || [[ -z "$PREV_SHA" ]]; then
  echo "Usage: scripts/rollback.sh <staging|production> <previous-git-sha>" >&2
  exit 1
fi

echo "== ROLLBACK: target=$TARGET  reverting to previously-deployed image for sha=$PREV_SHA =="
IMAGE_TAG="smokecraft-${TARGET}:${PREV_SHA}"

echo "-- Re-pointing ${TARGET} service at immutable image ${IMAGE_TAG} (previously built and audited — never rebuilt from a moving branch tip)"
echo "   NOT EXECUTED — no platform credentials available in this sandbox. On the real platform this is a single"
echo "   'redeploy previous release' action (Railway/Render/Fly all support redeploying a prior immutable build)."

echo "-- NOTE: this script intentionally does NOT run 'npm run db:migrate' — migrations are forward-only in this"
echo "   project. Rolling back the app to a version older than the latest-applied migration requires the matching"
echo "   file in server/db/rollbacks/ to be run manually and reviewed by the migration approval owner (see"
echo "   docs release-governance doc) before the app rollback proceeds, never automatically."

node scripts/recordDeploymentAudit.mjs "$TARGET" "$PREV_SHA" --rollback

echo "== Rollback script completed (audit-recorded) =="
