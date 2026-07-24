# 04 — Regression Matrix

All run this pass, exact counts (not weakened):

| Suite | Result | Baseline |
|-------|--------|----------|
| verify-smokecraft-railway-proxy-and-destinations.mjs (NEW) | **32/32** | — |
| verify-smokecraft-live-landing-and-destinations.mjs | **28/28** | 28/28 |
| verify-smokecraft-canonical-runtime.mjs | **19/19** | 19/19 |
| verify-smokecraft-canonical-journey-authority.mjs | **25/25** | 25/25 |
| verify-smokecraft-zero-legacy-runtime.mjs | **9/9** | 9/9 |
| verify-smokecraft-zero-old-visuals.mjs | **20/20** | 20/20 |
| verify-smokecraft-entry-prerequisite-guard.mjs | **43/43** | 43/43 |
| verify-smokecraft-27-session-sequence.mjs | **39/39** | 39/39 |
| verify-passport-security-unified-identity.mjs | **59/59** | 59/59 |
| production build (`npm run build`) | **exit 0** | exit 0 |
| backend startup (production mode) | **clean** (diagnostic emitted) | ok |
| health check (`/api/health`) | **200 ok** | 200 |

## Notes
- `verify-smokecraft-live-start-navigation.mjs` is named in the mandate but does
  not exist in the repo (prior pass consolidated its intent into
  `verify-smokecraft-live-landing-and-destinations.mjs`). The new proxy suite
  adds the proxy-specific Start/journey coverage (checks 2–6) that the local-only
  prior suite could not exercise. Not fabricating a run of a nonexistent file.
- The new suite requires a **production-mode** backend on :3001 (so the limiter
  validator is actually active) plus `vite preview` on :5050. The
  passport-security suite requires `vite` dev on :5000 and `DATABASE_URL` in its
  own env; run with the backend in dev mode to avoid the in-memory auth limiter's
  429 under repeated test load (a working limiter, not the bug).
