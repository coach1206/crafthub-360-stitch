# Phase 13 — Deployment Verification

## Deployment target identification (from repository configuration — not guessed)

- **Frontend:** Vercel. `vercel.json` at repo root: `buildCommand: "npm run build"`, `outputDirectory: "dist"`, with SPA rewrites for `/smokecraft/:path*` and a catch-all `/(.*)` → `/index.html`.
- **Backend/database:** Railway. `docs/RAILWAY_DATABASE_SETUP.md` documents the exact `DATABASE_URL` wiring convention for a Railway Postgres service feeding the Express backend.
- **CI:** `.github/workflows/smokecraft-visual-proof.yml` exists (a visual-proof check triggered on PRs touching SmokeCraft paths) — this is **not** a deployment workflow; no GitHub Actions workflow in this repository triggers a Railway or Vercel deploy, and none exposes a deployment-status check consumable from this session.

## Evidence actually available in this environment

This session runs in an isolated, ephemeral sandbox with a local git proxy remote (`http://local_proxy@127.0.0.1:41729/...`), **not** real GitHub — there is no GitHub API, no Railway API, no Vercel API, and no live public URL reachable from this container. None of the "preferred evidence order" items 1–4 (direct deployed-app access, deployment-provider status, GitHub deployment check/commit status, deployment logs) are obtainable here.

**What was directly verified instead (items 5–7 of the preferred evidence order, applied against a local production-mode instance):**
- Item 5 (health endpoint): `GET http://localhost:3001/api/health` → `200`, real DB-connected response — verified repeatedly.
- Item 6 (API endpoint response): all 5 completed systems' APIs verified live against the running production-mode server process (Phase 12).
- Item 7 (browser route verification): all 49 SmokeCraft routes verified live via the running production-mode server's static+fallback pipeline (`http://localhost:3001/smokecraft/challenge-hub` → `200`, Phase 12).

This proves the **code is deployment-ready and behaves correctly when run in production mode**, but it does **not** prove that any specific Railway/Vercel deployment currently reflects commit `80d63e65...`/this closeout's commit, because no external deployment provider is reachable from this sandbox.

## Explicit gaps (per the instruction not to hide an externally blocked check)

- Deployed commit vs. tested commit: **cannot be confirmed** — no Vercel/Railway deployment status is reachable.
- Whether a rollback occurred on the live deployment: **cannot be confirmed**.
- Whether the live production environment is using stale assets: **cannot be confirmed**.

## Conclusion

Deployment **configuration** was identified and is coherent (Vercel frontend + Railway backend/DB, matching the documented setup guide). Deployment **code-readiness** was directly proven via a real local production-mode run. Deployment **live-instance verification** is externally blocked by this sandbox having no network path to Vercel, Railway, or a real GitHub deployment-status API.

**This phase's result: ENGINEERING COMPLETE — LIVE DEPLOYMENT VERIFICATION BLOCKED**, per the mandate's own required status for exactly this situation. This status is carried forward into the final closeout report (`00-FINAL-REPORT.md`) rather than a false `PASS`.
