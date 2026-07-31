# Venue Humidor Production-Readiness Checklist

Nothing below is marked complete without a corresponding proof
artifact in this directory or an already-committed prior-package proof.

| Item | Status | Proof |
|---|---|---|
| Build | ✅ Done | `06-full-build.log` — full `npm run build` (prebuild validator chain + Vite build), exit 0 |
| Tests (API) | ✅ Done | `03-full-api-regression.log` — 269/269 across 8 suites |
| Tests (browser) | ✅ Done | `05-full-browser-regression.log` — 134/134 across 7 suites |
| Tests (validators) | ✅ Done | `04-full-validator-regression.log` — 8/8 PASS |
| Tests (closure live verification) | ✅ Done | `09-closure-live-verification-results.json` — 31/31 |
| Database migrations | ✅ Done | 106–113 all applied cleanly, idempotent re-run confirmed 0 newly applied, matching rollback for every migration (`ls server/db/rollbacks/`) |
| Environment variables | ⚠️ Partial | `DATABASE_URL` required and validated; `JWT_SECRET`/`FOUNDER_CHALLENGE_SECRET`/`ELEVENLABS_API_KEY` fall back to insecure dev defaults with an explicit startup warning (`[EnvValidator] ⚠`) — **must be set before any real production deploy**, this is an existing, honestly-surfaced app-wide gap, not something this pass silently accepted |
| Authentication | ✅ Done | Reused unchanged `requireAuth`/JWT session + SmokeCraft guest identity; no new auth mechanism |
| RBAC | ✅ Done | `07-rbac-matrix.md`, live probes in `08-security-review.md` |
| Venue isolation | ✅ Done | `09-closure-live-verification-results.json` §6, `requireResourceVenueMatch()` on every resource route |
| Customer isolation | ✅ Done | `09-closure-live-verification-results.json` §7 |
| Inventory integrity | ✅ Done | `09-closure-live-verification-results.json` §8 (exactly-once deduction under concurrency), live-computed availability confirmed via source read (no cached column) |
| Financial integrity | ✅ Done | `09-closure-live-verification-results.json` §11 (historical price preservation) |
| Payment boundary | ⚠️ Partial (by design) | No real payment gateway is integrated — checkout records `payment_status`/summary fields only; this is the existing, documented scope boundary from 1B-2A onward, not a regression |
| Logging | ✅ Reviewed | `08-security-review.md` §"Logging of sensitive information" — no pickup codes/payment data/tokens observed in server logs |
| Monitoring | ⚠️ Not built this pass | No dedicated Venue Humidor monitoring/alerting dashboard exists; the append-only event ledgers (`venue_cigar_inventory_events`, `venue_cigar_fulfillment_events`, `smokecraft_progression_events`) are queryable as an audit trail but no alerting layer sits on top of them — recorded as a known limitation |
| Error handling | ✅ Done | `08-security-review.md` §"Error-message leakage" — every controller returns only a short error code, never a stack trace |
| Backups | ⚠️ Out of scope | Database backup/restore strategy is an infrastructure concern outside the application codebase this pass can verify; not assessed |
| Rollback | ✅ Done | A matching `.rollback.sql` exists for every Venue Humidor migration (106–113) |
| Deployment | ⚠️ Not this pass | No CI/CD pipeline change was made or reviewed — deployment mechanics are outside this codebase-level closure pass |
| Smoke testing | ✅ Done | `09-closure-live-verification-results.json` §1 (full customer+staff E2E flow) |
| Security | ✅ Reviewed (scoped) | `08-security-review.md` — explicitly not a full certification; 3 known dependency vulnerabilities recorded, none Venue-Humidor-specific |
| Accessibility | ✅ Reviewed | Keyboard nav, `role`/`aria-*` attributes, large touch targets, non-color-only status confirmed present across every Venue Humidor screen (carried forward from each package's own accessibility closure, re-confirmed via the responsive/browser suites in this pass) |
| Responsive support | ✅ Done | `node scripts/validateSmokecraftResponsive.mjs` — 130/130 routes, 0 failures (fresh sweep data from the 1B-2B-5 pass remains valid since the route set is unchanged) |
| Proof artifacts | ✅ Done | This directory |
| Support documentation | ✅ Done | `docs/smokecraft/SMOKECRAFT_VENUE_HUMIDOR_ARCHITECTURE_MAP.md`, `SMOKECRAFT_STATE_OWNERSHIP_MAP.md`, `SMOKECRAFT_INTERACTION_MATRIX.md` updated across every package including this one |
| Known limitations | ✅ Documented | See below |

## Known limitations (honest, not hidden)

1. **No real payment gateway integration** — checkout captures a
   payment-status boundary only, by original design (1B-2A). Real card/
   ACH processing was never in scope for any Venue Humidor package.
2. **Dev-default secrets** — `JWT_SECRET`, `FOUNDER_CHALLENGE_SECRET`,
   and `ELEVENLABS_API_KEY` fall back to insecure development defaults
   with an explicit startup warning if unset. Must be set as real
   secrets before any production deploy; this is an existing app-wide
   condition, not introduced by Venue Humidor.
3. **3 dependency vulnerabilities** (`body-parser`, `react-router`,
   `react-router-dom`) — see `08-security-review.md`. Pre-existing,
   app-wide, not Venue-Humidor-specific code; not silently patched in
   this closure pass since a `react-router` major-version bump is a
   cross-application change outside this pass's scope.
4. **No dedicated monitoring/alerting layer** on top of the append-only
   event ledgers — the data needed for alerting exists and is queryable,
   but no alerting service was built.
5. **No real beverage/menu catalog** — pairing works only at the
   existing pairing engine's abstract category level (documented since
   1B-2B-5); a real venue beverage catalog integration was explicitly
   out of scope.
6. **Large main JS bundle** (`index-*.js` ~5.3MB pre-gzip, ~915KB
   gzipped) — a pre-existing Vite build-size warning across the whole
   app, not introduced or made worse by Venue Humidor specifically;
   code-splitting was not attempted in this pass (out of scope per
   mandate §17, "do not perform unrelated large-scale optimization").
7. **Backup/restore and CI/CD deployment mechanics** were not assessed
   — outside what this codebase-level pass can verify.
