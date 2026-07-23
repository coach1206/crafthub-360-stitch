# 02 — Deployed Commit Verification

## Result: UNDETERMINED — blocked

No reliable evidence source for the actual deployed commit was reachable in this session:

- Direct production URL access is blocked by organization egress policy (403 on CONNECT to `crafthub360.up.railway.app:443`, confirmed via the agent-proxy status endpoint — not a transient failure, not retried per the standing "do not retry 403/407" rule).
- No Railway CLI or authenticated dashboard session exists in this environment.
- No GitHub Actions deployment workflow exists in this repository to inspect run history/logs for a deploy step.
- `get_commit` (GitHub MCP) for the current `HEAD` returned no deployment-related status or check data — Railway's native GitHub integration (if configured) does not appear to post commit statuses/checks visible through this tool, or none exist for this specific commit.
- The safe `/api/version` endpoint added this pass (`GET /api/version`, returning `commit`/`buildTimestamp` from `RAILWAY_GIT_COMMIT_SHA`/`RAILWAY_DEPLOYMENT_CREATED_AT` when present) cannot be queried against production because production is unreachable from this session.

## Strongest available indirect evidence

`main` is the repository's default branch (`git remote show origin` → `HEAD branch: main`). `b55c867d` (Phase 9A, the first commit of this operation's Golden Box Packaging Studio journey work) is **not** an ancestor of `origin/main`. If deployment is configured to auto-deploy the default branch (the common default for both Railway and Vercel GitHub integrations), the live service would be running code from before this entire multi-phase operation began — not `f00e6475`/`0985bd90`, and not containing Phases 5 through 10 of this operation, Golden Box, Packaging Studio, or the Phase Architecture Reconciliation.

This is disclosed as **indirect, not conclusive** evidence — it is possible (though not confirmed) that the Railway service is instead configured to deploy from `recovery/smokecraft-codex-final` specifically, in which case this concern would not apply. Without dashboard/CLI access, this cannot be confirmed either way.

## What would close this gap

Any one of the following, supplied by the user/operator, would allow this determination to proceed://
1. A Railway dashboard screenshot or exported deployment log showing the service's configured deploy branch and the currently-deployed commit SHA.
2. Authenticated Railway CLI access in this session (`railway status`/`railway logs`).
3. A response from `https://crafthub360.up.railway.app/api/version` (once this pass's endpoint is deployed) or `.../api/health`, either fetched by the user directly or via an allowed network path.
4. Confirmation of whether `crafthub360.up.railway.app` is still the authoritative production URL, or whether it has changed.

## Conclusion

**The deployed commit cannot be verified in this session.** Per this phase's own explicit instruction ("If the live service is on an earlier commit, this phase fails until deployment is updated" / "If external access is still blocked... Do not mark Phase 10 complete... Keep the checklist unchecked"), this finding alone is sufficient to keep Phase 10 unresolved regardless of any other verification performed.

## 2026-07-23 update — Phase 10 Closeout pass (deploy-and-verify attempt)

A later pass ("Phase 10 Closeout: Deploy and Live-Verify the Start/Resume Fix") requested deploying commit `cbd1e7ae50685383246a5665a5b9d71fdfe5867c` and live-verifying it. Two things are recorded here:

1. **The requested commit is now stale.** `cbd1e7ae...` was the repository HEAD at the *start* of the subsequent "Start vs. Resume Journey State Correction" pass — it contains only the `lastCompletedSession`/`completionPercent` fix, not the `hasProgress`/CTA-text fix (the actual defect the live screenshots showed: the wrong `RESUME JOURNEY` label). The commit that actually contains the full fix is `7f259e7a4f8a02ad466879d098d01a65fe811623` (current `HEAD` at the time of this update, verified local=remote, clean tree). Deploying `cbd1e7ae...` alone would not resolve the reported CTA-label defect.
2. **This session still cannot deploy or verify anything against Railway.** No Railway CLI is installed, no Railway credentials/config are present in this environment (`which railway`, `env | grep -i railway`, and a filesystem search for `*.railway*` config all returned nothing), and direct network access to `crafthub360.up.railway.app` is still policy-blocked (confirmed again: `curl` returns `(56) CONNECT tunnel failed, response 403`, and the agent-proxy's own failure log records this as a policy denial, not a transient error). There is no "Railway service settings" this session can inspect, no deploy trigger this session can fire, and no live endpoint this session can query.

**This pass cannot perform the deployment or live verification it was asked to perform.** No fabricated deployment ID, timestamp, or live response is recorded anywhere in this repository as a result of this pass.
