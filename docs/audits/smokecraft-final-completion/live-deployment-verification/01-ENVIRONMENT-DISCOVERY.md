# 01 — Environment Discovery

**Starting commit (as given):** `f00e6475e76ccf9143d1be22c15de13e11bea49d`

## Starting-state verification result

On fetch, `origin/recovery/smokecraft-codex-final` had already advanced one commit past `f00e6475e76ccf9143d1be22c15de13e11bea49d`:

- `0985bd90c87ee6f13860f44eb52570d158d034b0` — " Constructure , build studio" — adds 2 image assets only (` Blend Revision Round.png`, ` Golden Box Build Studio construction method.png`), no code/doc changes (`git diff --stat` against `src/`, `server/`, `docs/` is empty).

This is the same pattern already seen twice earlier in this operation (concurrent image-only pushes from another active session/collaborator working on the same branch). Per git safety protocol (investigate before overwriting; this is a clean fast-forward, not a conflicting rewrite), local was fast-forwarded to `0985bd90c87ee6f13860f44eb52570d158d034b0` — **no reset, revert, or rebuild of any completed work occurred.** This is disclosed here rather than silently proceeding on a stale local ref.

The three previously-flagged concurrent image commits (`0bc6ae58`, `ece0948a`, `c40feaa9`) are confirmed present as ancestors of the current `HEAD` (`git merge-base --is-ancestor` returned true for all three).

**Working tree:** clean, confirmed via `git status --short` after fast-forward.

## Provider discovery (from repository configuration)

- **`vercel.json`** exists at repo root: `buildCommand: npm run build`, `outputDirectory: dist`, SPA rewrites for `/smokecraft/:path*` and catch-all → `index.html`. This is a static-frontend deployment config.
- **`docs/RAILWAY_DATABASE_SETUP.md`** documents a Railway service named **`CRAFTHUB_360`** with a linked Postgres service, and `server/scripts/verifyRailwayEnv.js` (a safe, secret-redacting `DATABASE_URL` diagnostic script intended to be run "in the production Railway Console").
- **`nixpacks.toml`** exists (Railway's default builder config file), confirming Railway as the backend/full-app host.
- **`package.json` `start` script:** `npm run build && node server/index.js` — a single Express process serves both the built frontend and the API in one deployable unit when run this way, which is consistent with a single Railway service hosting everything (the separate `vercel.json` may be legacy/unused, or Vercel may host a static mirror — **this cannot be confirmed without dashboard/API access, which is blocked; see below**).
- **No GitHub Actions deployment workflow exists.** The only workflow in the repository is `.github/workflows/smokecraft-visual-proof.yml` ("MVP2 Visual Proof") — a visual regression/proof workflow, not a deploy pipeline. There is no CI/CD workflow that builds and deploys to Railway or Vercel from GitHub Actions; deployment (if configured) would be via each provider's own native GitHub-push integration, which is not visible from repository files alone.

## Critical finding: default branch mismatch

`git remote show origin` reports **`main`** as the repository's default (`HEAD`) branch — **not** `recovery/smokecraft-codex-final`, the branch every pass of this entire operation has developed on.

`origin/main`'s tip (`af3956bb`, "Merge pull request #41 from coach1206/hotfix/smokecraft-main-live-interactions") was checked for ancestry: **`b55c867d` (Phase 9A) is NOT an ancestor of `main`.** None of this operation's work — Phases 5 through 9, Golden Box Packaging Studio, the Phase 9 Journey Amendment, or the Phase Architecture Reconciliation — has ever been merged into `main`.

Any conventional auto-deploy configuration (Railway/Vercel deploying on push to the repository's default branch) would be building and serving `main`, which predates and does not contain any of this operation's completed work. This is disclosed as a **major, unresolved finding** for this phase, not assumed away.

## Production URL(s)

- **Known historical frontend URL (given, not verified):** `https://crafthub360.up.railway.app`
- No corroborating production URL is documented anywhere in this repository's own files (`.env.example`, master rebuild plan, performance-budget doc) — the URL was supplied externally, not discovered independently in-repo.

## Network access result

Direct HTTPS access to `crafthub360.up.railway.app` was attempted and returned a **policy denial**, not a transient failure:

```
curl -sS -m 15 https://crafthub360.up.railway.app/  → curl: (56) CONNECT tunnel failed, response 403
```

Confirmed via the agent-proxy status endpoint (`/root/.ccr/__agentproxy/status`):
```
"recentRelayFailures": [
  { "kind": "connect_rejected", "detail": "gateway answered 403 to CONNECT (policy denial or upstream failure)", "host": "crafthub360.up.railway.app:443" }
]
```
Per this session's own operating rules, a 403 from the egress proxy is an organization policy denial, not to be retried or routed around — it is reported here rather than treated as a transient network blip.

## Evidence source summary

| Source | Attempted | Result |
|---|---|---|
| Direct production URL (curl) | Yes | Blocked — 403 policy denial |
| Provider dashboard/CLI (Railway) | Yes (checked for credentials/CLI in session) | Not available — no Railway CLI authenticated in this session |
| GitHub Actions deployment workflow | Yes | None exists (only a visual-proof workflow) |
| GitHub commit statuses/checks for deploy events | Yes (via `get_commit`) | No deployment-related status/check data returned |
| Provider build logs | Yes (searched repo for CI/CD config) | No accessible log source found |
| Safe version endpoint (`/api/version`) | N/A — cannot reach the production backend to query it | Not reachable |
| Default-branch/deployed-code analysis (indirect) | Yes | **`main` (the default branch) does not contain this operation's work** — strong indirect evidence the live deployment, if tracking the default branch, is stale relative to `f00e6475`/`0985bd90` |

## Verification result

**Environment discovery is incomplete and inconclusive for live-commit verification.** Direct network access is policy-blocked, no CI/CD deployment workflow exists in-repo to inspect, and no provider dashboard/CLI credentials are available in this session. The strongest available evidence (default-branch ancestry) suggests the live deployment, if configured conventionally, does not currently serve any of this operation's completed work. See `02-DEPLOYED-COMMIT.md` for the formal deployed-commit determination.
