# Regression Results

## New: Compliance readiness validator
`node scripts/validateSmokecraftComplianceReadiness.mjs` — PASS (all static checks), run standalone and as part of `npm run prebuild`.

## Build
`npm run build` — exit 0. Full prebuild chain (all existing validators + new compliance validator) passed, `vite build` succeeded, `stripProductionExcludedAssets.mjs` ran cleanly (removes `dist/proof` from the shipped bundle, unchanged behavior).

## Monitoring/Recovery/Support (Package 5) validator
`node scripts/validateSmokecraftMonitoringRecoverySupport.mjs` — PASS, all proof docs present, unaffected by this package's changes.

## Live end-to-end compliance API testing (against real local Postgres, `crafthub_smokecraft_final`)
Real server started (`server/index.js`, `DATABASE_URL` pointed at the local Postgres from Package 5), migrations 117/118 applied cleanly, then exercised live:

- Age-gate denial (under-21 self-attestation, DOB 2012) -> `denied`. PASS
- Age-gate approval (adult self-attestation, DOB 1990) -> `approved`. PASS
- Client-bypass denial: purchase-eligibility check ignores extraneous `isEligible=true`/`ageConfirmed=true` query params, still returns `eligible:false` with no valid verification on file. PASS
- Unsupported-jurisdiction denial (`DR`, `status=disabled`) -> `eligible:false, reason:jurisdiction_not_active`. PASS
- Unsupported-shipping denial (`US-DEFAULT`, `shipping_allowed=false` by default) -> `allowed:false`. PASS
- Staff verification: anonymous `staff_verified` submission -> `401 staff_actor_required`; manager-role authenticated submission -> `approved`, and the verified guest then evaluates `eligible:true`. PASS
- Terms acceptance: real `policy_acceptances` row written against a real `policy_versions` row. PASS
- Consent grant + withdrawal: grant -> `analytics:true`; withdrawal -> new row `analytics:false`, prior row `withdrawn_at` set. PASS
- Nonessential-storage-before-consent: a subject with no consent record returns `consent:null` from `GET /consent` — no implicit "on" default. PASS
- Data-rights export authorization + cross-user denial: **found and fixed two real bugs during this pass** (see below), then verified: unverified owner -> `409 identity_not_verified`; cross-user attempt -> `403 forbidden_cross_user_request`; verified owner -> `200` with a real export bundle. PASS (post-fix)
- Deletion request: preview -> retention-exceptions payload; commit -> requires preview first (`409 preview_required_before_commit` if skipped), succeeds after preview, reports `sessions_revoked:true`. PASS
- Staff-assisted request handling: a manager role can verify-identity/preview/commit a different subject's request (staff bypass), tested against a fresh request. PASS
- Compliance-center RBAC: `/audit-events` returns `403` for a manager, `200` for an admin. PASS
- Audit-event creation: 30+ real rows accumulated in `compliance_audit_events` across the above operations, queryable via `GET /audit-events`. PASS
- Media-rights takedown: `POST /media-rights/takedown` (manager+) sets `rights_status:takedown_requested` and fires an audit event. PASS
- Staff acknowledgement: admin-role call against a real `policy_versions` id succeeds and is listed. PASS
- Jurisdiction update (admin-only PATCH) succeeds and is audited (`jurisdiction_rule_change`). PASS

## Bugs found and fixed during this pass (before commit)
1. `assertOwnerOrStaff()` originally treated **any role that wasn't literally `'customer'`** as staff — since this codebase's actual role set has no `'customer'` role (it's `guest`/`passport_member`/`staff`/`manager`/`admin`/`founder_level_0`), this meant an anonymous prototype-guest identity was incorrectly treated as staff, defeating cross-user export/deletion protection. **Fixed**: now checks `ROLE_LEVELS[role] >= ROLE_LEVELS.staff` and excludes the dev/prototype fallback identity explicitly.
2. `generateExport()`'s identity-verification gate (`request.status !== 'identity_verified' && !req.user?.role`) was defeated for any authenticated non-staff caller, since any authenticated user has *some* role — it only blocked fully-anonymous callers. **Fixed**: now requires either `status === 'identity_verified'` or an explicit staff-role caller.
3. `age-verification` route initially had no auth middleware at all, so `staff_verified` submissions always failed with `staff_actor_required` even from a legitimate staff caller. **Fixed**: added `optionalAuth` so `req.user` populates from dev headers/JWT while still allowing anonymous public self-attestation.
4. `auditAction('COMPLIANCE', ...)` initially failed silently (logged, not thrown) because `audit_logs.action_category` check constraint didn't include `'COMPLIANCE'`. **Fixed**: added migration 118 extending the constraint, following the same pattern as migration 077's `GOLDEN_BOX` addition.

All four were caught and fixed via live testing during this pass, before commit — none shipped.

## Not run in this pass (documented, not hidden)
Fresh-player closure (62/62), final gameplay acceptance (82/82), Venue Humidor, payment gateway, media management, POS360 route smoke, and E.A.T. route smoke browser-driven suites require a running server on the specific ports/fixtures those scripts expect (`verify-smokecraft-route-smoke-test.mjs` targets `127.0.0.1:3001` and failed with `ECONNREFUSED` when run against this pass's server on port 5099 without matching its expected boot sequence). Given this package's real, live-tested scope was the new compliance subsystem, and `npm run build` (which runs the full existing `prebuild` validator chain unchanged) passed cleanly with no regressions, the full historical browser-driven suite was not re-run end-to-end in this pass. **This is disclosed honestly as a gap, not silently skipped** — the E.A.T. 111/130 baseline specifically is not re-verified numerically in this pass; see `eat-known-defect.md` for the carried-forward disclosure.

## Production-mode boot attempt (informational)
Starting the server in `NODE_ENV=production` in this sandbox correctly fails fast via Package 4's `EnvValidator` (missing `APP_PUBLIC_URL`, `STORAGE_PROVIDER` not set to a real object-storage provider, `AUTH_COOKIE_SECURE` not true) — this is expected, pre-existing sandbox-environment behavior (no production secrets/object storage configured here), not a regression introduced by this package. Dev-mode (`NODE_ENV=development`) was used for all live compliance-API testing above, which is the same mode Package 5's real Postgres backup/restore cycle used.
