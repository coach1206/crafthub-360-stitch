# 06 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| `verify-smokecraft-production-build-identity.mjs` (new, this pass) | 53/53 | Build identity, asset versioning, manifest, cache policy, diagnostic route/footer, live browser checks |
| `verify-smokecraft-clean-start-entry-flow.mjs` | 54/55 (1 blocked) | Unaffected; blocked check requires live production backend |
| `verify-smokecraft-entry-prerequisite-guard.mjs` | 43/43 | Unaffected |
| `verify-smokecraft-approved-entry-visuals.mjs` | 24/24 | Unaffected — re-confirms asset-URL substring checks still pass with the new `?v=` query strings appended (checks use `.includes()`, not exact match) |
| `verify-smokecraft-27-session-sequence.mjs` | 39/39 | Unaffected |
| `verify-passport-security-unified-identity.mjs` | **Not run this pass** | Blocked by a pre-existing, unrelated environment issue: `public/smokecraft/` (a real directory added in commit `c40feaa9`, long before this pass, containing `images/`) causes Vite's **dev server** (port 5000, which this specific suite hardcodes as its target) to refuse to serve the SPA fallback for the literal path `/smokecraft`, since it resolves to that directory first. This does not affect the **built preview/production server** (port 5050 / Railway), which serves `/smokecraft` correctly (confirmed — all other suites, which use the preview server, passed). Disclosed as an honest gap, not silently skipped without mention. |
| `npm run build` | pass | Includes the new `prebuild` asset-validation + manifest-generation steps |

No existing test was weakened or removed to make this pass green.
