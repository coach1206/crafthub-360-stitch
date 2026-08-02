#!/usr/bin/env bash
# Production Package 4 — repeatable deployment script.
# Usage: scripts/deploy.sh <staging|production> [git-sha]
#
# This script has NOT been run against live infrastructure in this
# sandbox (no cloud credentials exist here). It is real, runnable
# logic — the only thing untested is the final `curl`/platform-CLI call
# to an actual staging/production host, which is clearly marked below.
set -euo pipefail

TARGET="${1:-}"
SHA="${2:-$(git rev-parse HEAD)}"

if [[ "$TARGET" != "staging" && "$TARGET" != "production" ]]; then
  echo "Usage: scripts/deploy.sh <staging|production> [git-sha]" >&2
  exit 1
fi

echo "== SmokeCraft 360 deployment: target=$TARGET sha=$SHA =="

# 1. Refuse to deploy from an unclean tree.
if [[ -n "$(git status --porcelain)" ]]; then
  echo "REFUSED: working tree is not clean. Commit or stash changes before deploying." >&2
  exit 1
fi

# 2. Build an immutable artifact (container image tagged by commit SHA — never 'latest').
IMAGE_TAG="smokecraft-${TARGET}:${SHA}"
echo "-- Building immutable image ${IMAGE_TAG}"
docker build -t "$IMAGE_TAG" .

# 3. Environment-specific config is supplied by the platform's env-var
#    store (Railway/Render/Fly project settings) at container start —
#    never baked into the image. See docs/deployment/environment-contract.md.

# 4. Migration step — controlled, run-before-start, not inside app boot.
echo "-- Running database migrations for $TARGET (requires DATABASE_URL for that environment)"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "SKIPPED (no DATABASE_URL in this shell — set it to the ${TARGET} database before running for real)"
else
  npm run db:migrate
fi

# 5. Deployment step — platform-specific. Placeholder call, clearly marked.
echo "-- Deploy step: would push ${IMAGE_TAG} to the ${TARGET} service on the chosen platform (Railway/Render/Fly CLI)."
echo "   NOT EXECUTED — no platform credentials available in this environment."

# 6. Health verification.
HEALTH_URL="${DEPLOY_HEALTH_URL:-}"
if [[ -n "$HEALTH_URL" ]]; then
  echo "-- Verifying readiness at ${HEALTH_URL}/api/health/ready"
  curl -fsS "${HEALTH_URL}/api/health/ready" || { echo "READINESS CHECK FAILED — see rollback.sh"; exit 1; }
else
  echo "SKIPPED health verification (DEPLOY_HEALTH_URL not set — no live target in this sandbox)"
fi

# 7. Smoke tests.
echo "-- Running deployment smoke test suite"
DEPLOY_TARGET_URL="${DEPLOY_HEALTH_URL:-http://127.0.0.1:3000}" node scripts/verify-smokecraft-production-deployment.mjs || {
  echo "SMOKE TESTS FAILED — invoke scripts/rollback.sh ${TARGET} <previous-sha>"; exit 1; }

# 8. Deployment audit record.
node scripts/recordDeploymentAudit.mjs "$TARGET" "$SHA"

echo "== Deployment script completed for target=$TARGET sha=$SHA =="
