# 01 — Deployment Source-of-Truth Audit

## What could be verified from repository evidence

- **Correct repository:** `coach1206/crafthub-360-stitch` (confirmed — this session's own `git remote`).
- **Correct branch:** `recovery/smokecraft-codex-final`, local HEAD == remote HEAD == `b2df4f2219a4f32306413ebb5f28a6b79150acd5` at audit start (confirmed).
- **Correct latest commit:** as above.
- **Build command:** `vite build` (via `npm run build`), confirmed to run and pass locally, no errors.
- **Start command:** `node server/index.js` (via `npm start`, which runs `npm run build && node server/index.js`), confirmed present and correct in `package.json`.
- **No `railway.json`/`railway.toml`** exists in the repository — Railway would be relying on Nixpacks auto-detection of `package.json`'s `start` script, or on a manually-configured start command set in the Railway dashboard itself (which this session cannot see).
- **`nixpacks.toml`** exists and only adds `python3`, `gcc`, `gnumake` build-phase system packages (for native npm module compilation) — does not override the start command.
- **`/api/version`** is a real, already-built endpoint (`server/controllers/healthController.js`) that reports `process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || null` honestly — this was built specifically so a live deployment's commit could be verified, but it can only be read by querying the live URL.
- **No GitHub Actions deployment workflow** exists (`.github/workflows/` contains only `smokecraft-visual-proof.yml`, a CI check unrelated to deployment) — deployment is presumably Railway's own git-push auto-deploy, which this session cannot observe or trigger.

## What could NOT be verified — and why

| Question | Result |
|---|---|
| Is Railway's Source correctly set to this repo/branch? | **Unknown** — no dashboard access |
| Is auto-deploy enabled? | **Unknown** — no dashboard access |
| Does the deployed build include commit `b2df4f22` or later? | **Unknown** — `/api/version` unreachable |
| Are frontend and backend from the same commit? | **Unknown** — both are built/served by the same single `npm start` process in this codebase (no separate frontend/backend deploy), so if Railway deploys at all, they are inherently the same commit by construction — but this cannot be confirmed live |
| Can Railway serve an old image layer despite a newer source commit? | **Structurally possible** — if the last deploy attempt failed or was never triggered, Railway would keep serving whatever the last successful deploy was, which this session has no way to check |
| Does a failed build leave the previous deployment active? | This is Railway's documented default behavior (failed builds do not take a service down) — consistent with, and a plausible explanation for, the user's repeated "repo says X but live still shows Y" reports across this entire operation |
| Is more than one CraftHub service connected to this repo? | **Unknown** — no dashboard access |
| Do `www.noveeos.com` and `crafthub360.up.railway.app` point to different builds? | **Unknown** — this session has never had access to test `www.noveeos.com` either; both are outside this session's confirmed network reach |
| Build cache preserving stale assets? | Possible in principle (Nixpacks/Docker layer caching); cannot be confirmed or ruled out without dashboard/build-log access |

## Network access re-confirmation (this pass)

```
curl -sv https://crafthub360.up.railway.app/api/version
< HTTP/1.1 403 Forbidden
* CONNECT tunnel failed, response 403
```

Agent-proxy status log confirms: `"kind": "connect_rejected", "detail": "gateway answered 403 to CONNECT (policy denial or upstream failure)", "host": "crafthub360.up.railway.app:443"` — identical to every prior check across this entire operation (Phase 10 and every pass since).

No Railway CLI is installed (`which railway` → empty). No `RAILWAY_*` environment variables are set in this session.

## Honest conclusion

**This session cannot claim production is current, and cannot claim it is stale.** Every deployment-layer question above resolves to "Unknown, not "confirmed correct" and not "confirmed broken." This is the single most consequential fact in this entire audit: **the repeated cycle of "engineering complete locally, still wrong live" cannot be distinguished, from inside this session, between (a) a genuine remaining code defect and (b) Railway simply never having deployed the fix commit at all.** Every prior pass's local-only "PASS" is real and honest for what it tested, but it has never been sufficient to close the live gate, and this audit cannot change that without external deployment access.
