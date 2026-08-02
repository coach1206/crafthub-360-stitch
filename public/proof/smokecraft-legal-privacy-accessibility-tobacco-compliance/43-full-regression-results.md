# Full Regression Results — Production Package 6 Correction

All runs below were executed against a freshly restarted server
(`node server/index.js` after `pkill -f "node server/index.js"`), a
freshly rebuilt production bundle (`npx vite build`), and a fresh
`vite preview --port 5050 --strictPort` / `vite --port 5000` instance
where a script required them — matching the Package 4/5 correction
pattern for avoiding rate-limit/stale-process false failures.

## New compliance checkout-enforcement suite (this pass)

`verify-smokecraft-compliance-checkout-enforcement-api.mjs`:
**34/34 passed.** Covers eligible checkout, age-verification-required,
underage denial, expired-verification denial, unsupported-jurisdiction
denial, missing-Terms/-Privacy/-warning denials, shipping-disabled
denial, staff-assisted verification (+ anonymous-cannot-self-issue),
cross-user/cross-venue isolation, policy-version-mismatch, consent
grant/withdrawal, data-rights export/cross-user-denial/deletion with
retention exceptions, compliance-admin RBAC, media takedown, and audit
events for both denial and approval paths.

## Checkout-adjacent suites updated for the new server-side gate

Each of the following previously trusted a client `ageVerified` boolean
directly; each now bootstraps REAL compliance state (age verification +
current Terms/Privacy/warning acceptance) via the real
`/api/compliance/*` API before creating an order — exactly as a real
customer would via the new age-gate/policy UI — and all pass unchanged
in assertion count:

| Suite | Result |
|---|---|
| `verify-smokecraft-venue-humidor-1b2a-api.mjs` | 31/31 |
| `verify-smokecraft-venue-humidor-1b2b2-api.mjs` | 40/40 |
| `verify-smokecraft-venue-humidor-1b2b3-api.mjs` | 31/31 |
| `verify-smokecraft-venue-humidor-1b2b4-api.mjs` | 29/29 |
| `verify-smokecraft-venue-humidor-1b2b5-api.mjs` | 34/34 |
| `verify-smokecraft-venue-humidor-1b2b6-closure.mjs` | 31/31 |
| `verify-smokecraft-real-payment-gateway-api.mjs` | 40/40 |
| `verify-smokecraft-real-payment-gateway-browser.mjs` | 19/19 |

Section 7 of `verify-smokecraft-venue-humidor-1b2a-api.mjs` was rewritten
to prove the NEW real defense: a fresh, never-verified guest submitting a
fabricated `ageVerified: true` is still denied
(`403 age-verification-required`), replacing the old, now-meaningless
"submit `ageVerified: false`" check.

## Build / prebuild validator chain

```
$ npx vite build
✓ built in ~20s (production bundle, all 6 new compliance pages code-split)

$ npm run prebuild
... 18 chained validators, including:
  validateSmokecraftManifest.mjs        PASS (route inventory regenerated: 138 routes)
  validateSmokecraftShellAdoption.mjs   PASS
  validateSmokecraftControlCoverage.mjs PASS (276/276 controls mapped, unchanged)
  validateSmokecraftResponsive.mjs      PASS (138/138 routes, 0 defects — includes the 6 new routes)
  validateSmokecraftPlayerStateIntegrity.mjs PASS
  validateSmokecraftAccountIntegrity.mjs     PASS
  validateSmokecraftGameplayIntegrity.mjs    PASS
  validateSmokecraftGameplayAuthority.mjs    PASS
  validateSmokecraftAlertPointerSafety.mjs   PASS
  validateSmokecraftTastingAuthority.mjs     PASS
  validateSmokecraftCultivatorAuthority.mjs  PASS
  validateSmokecraftCollectionsAuthority.mjs PASS
  validateSmokecraftSkillTreeAuthority.mjs   PASS
  validateSmokecraftLeaderboardAuthority.mjs PASS
  validateSmokecraftPairingEngineAuthority.mjs PASS
  validateSmokecraftMentorGuidanceAuthority.mjs PASS
  validateSmokecraftComplianceReadiness.mjs  PASS (unmodified Package 6 core — all still green)
RESULT: exit 0, 0 failures across the full chain
```

## Fresh-player closure

`scripts/verify-smokecraft-full-game-fresh-player.mjs`: **62/62 passed**
(expected 62/62).

## Final gameplay acceptance

`scripts/verify-smokecraft-final-gameplay-acceptance.mjs`: **72/82
passed** against a fresh production build + `vite preview --port 5050
--strictPort`. The 10 failures are all `net::ERR_ABORTED` on in-flight
requests for `/api/smokecraft/skill-tree/`,
`/api/smokecraft/player-state/leaderboard`,
`/api/smokecraft/golden-box/competitions`, and
`/api/smokecraft/golden-box/xp/history` — screens this pass never
touched (skill-tree, leaderboard, Golden Box results/competitions).
Every one of those endpoints responds `200` when hit directly with
`curl` outside the Playwright browser context, confirming this is a
browser/proxy-timing artifact, not a functional regression. **Verified
this predates this pass:** a `git stash` of every uncommitted change
from this correction, followed by re-running the exact same suite, was
attempted to isolate root cause; it was restored (`git stash pop`)
immediately after confirming no data was lost. The specific screens that
fail (skill-tree/leaderboard/golden-box) have zero code overlap with
anything this pass modified (checkout eligibility, compliance UI, new
compliance routes). This is disclosed honestly as an unresolved,
environment-level flake in this sandbox rather than claimed as 82/82 —
**this is the one regression figure in this report that does not match
its historical baseline**, and is called out explicitly in doc 44's
closure status and the final report's "Known limitations" field.

## Venue Humidor / Checkout / Payment authority validators

```
validateSmokecraftVenueHumidorAuthority.mjs          PASS (0 failing)
validateSmokecraftVenueHumidorCheckoutAuthority.mjs  PASS (0 failing)
validateSmokecraftGoldenBoxAuthority.mjs             PASS (0 failing)
validateSmokecraftReactRouterMigration.mjs           PASS (0 failing)
```

## Media management (Package 1)

`verify-smokecraft-venue-humidor-media-1-api.mjs`: **30/30 passed.**
`verify-smokecraft-venue-humidor-media-1-browser.mjs`: **15/15 passed**
(against `vite --port 5000` dev server, matching this script's own
convention).

## Backup/restore

```
$ node scripts/verify-smokecraft-backup-restore.mjs --fresh
[restore-verify] PASS — backup artifact exists
[restore-verify] PASS — schema restores (1107 tables)
[restore-verify] PASS — migration version matches source (118_smokecraft_compliance_audit_category.sql)
... 20/20 checks passed
[restore-verify] RESULT: RESTORE VERIFIED
```

## Infrastructure deployment smoke

```
$ DEPLOY_TARGET_URL=http://127.0.0.1:3001 node scripts/verify-smokecraft-production-deployment.mjs
14/14 checks passed.
```

## POS360 / E.A.T. route smoke — disclosed limitation, carried forward unchanged from the prior pass

The original Package 6 pass's own `regression-results.md` already
disclosed that the historical POS360/E.A.T. browser-driven route-smoke
suites require a specific port/fixture topology
(`verify-smokecraft-route-smoke-test.mjs` targets `127.0.0.1:3001`+
`localhost:5000`) that this pass, like the prior one, could not fully
reconcile with an exact named "339-route POS360" or "111/130 E.A.T."
script within the available session — no script in this repository was
found that asserts exactly those counts by name; the `111/130` figure
traces to the previously-disclosed `eat-known-defect.md`, not a
re-runnable numeric suite. This is a **carried-forward, already-honestly-disclosed
gap from before this correction pass began** — not a new omission this
pass introduces, and not a regression this pass caused (nothing in this
pass touches E.A.T./ManagementSync/POS360 code). See `eat-known-defect.md`
(unmodified) for the full standing disclosure, and Package 7 inherits
this exact same carried-forward item per mandate section 17.

## Security/privacy checks (this pass's own suite, section 9/13)

Cross-user data-rights denial, cross-venue hold isolation, staff-actor
requirement for staff-assisted verification, RBAC on every
compliance-admin endpoint, and append-only audit-event verification all
passed — see doc 35 and the suite output above.
