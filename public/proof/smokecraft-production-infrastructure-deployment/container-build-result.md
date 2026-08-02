# Container build result — HONEST DISCLOSURE

`docker` CLI (v29.3.1) and `dockerd` are both present in this sandbox and
the daemon starts successfully (`docker info` succeeds). A real `docker
build` was attempted twice against `Dockerfile`.

Both attempts failed identically at the base-image pull step:

```
ERROR: failed to copy: httpReadSeeker: failed open: failed to do request:
Get "https://production.cloudfront.docker.com/registry-v2/...": Forbidden
```

Confirmed via `curl $HTTPS_PROXY/__agentproxy/status` that this is a genuine
organization egress-policy denial (403) on `production.cloudfront.docker.com`,
not a proxy misconfiguration — the status endpoint's `recentRelayFailures`
shows `"kind":"connect_rejected","detail":"gateway answered 403 to CONNECT
(policy denial or upstream failure)"`. Per this sandbox's own operating
instructions, policy denials are not retried/routed around.

**What this means**: Docker Hub image pulls (`node:20-bookworm-slim`) are
blocked by network egress policy in this sandbox. This is a sandbox network
restriction, not a defect in the Dockerfile.

**What WAS verified without a successful pull:**
- Dockerfile is syntactically valid — buildkit successfully parsed the full
  3-stage FROM/COPY/RUN graph and reached the exact `FROM` line reported in
  the error (proof the parser accepted everything before that point).
- Manual structural review: pinned Node 20 runtime, 3-stage build
  (deps/build/runtime), `npm ci --omit=dev` for the production-deps stage,
  non-root `smokecraft` user before `CMD`, `HEALTHCHECK` wired to the real
  `/api/health/live` endpoint, no secrets as `ARG`/`ENV`, `.dockerignore`
  excludes `node_modules`, `.git`, all `verify-*.mjs`/`e2e-*.mjs` test
  scripts, `attached_assets`, `public/proof`, `public/handoff`, and image
  fixtures from the build context.
- Graceful shutdown (SIGTERM/SIGINT) was added to `server/index.js` and
  verified for real by starting the server locally and killing it — see
  `local-production-server-startup.log` and the "server stopped" evidence
  in this pass's transcript (connection refused after `kill`).

**Not proven this pass**: an actual running container, its image size, or a
container-internal smoke test. This is a real gap, disclosed rather than
hidden — see `known-limitations.md`.
