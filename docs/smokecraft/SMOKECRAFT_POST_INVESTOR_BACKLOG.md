# SMOKECRAFT 360 — POST-INVESTOR BACKLOG

This backlog covers all work deferred from the investor freeze. None of these tasks may alter the frozen investor build at commit `04efc8c4` / tag `smokecraft-v1.0.0-investor-ready`. All work occurs on a new branch after the freeze.

---

## R14 — Image Optimization (Complete the PARTIAL)

- [ ] Wire optimized WebP variants into active route components (replace `src=` references with `<picture>` + `<source type="image/webp">`)
- [ ] Implement responsive image sources (`srcset`, `sizes`) for all SmokeCraft asset screens
- [ ] Verify route-by-route visual parity against frozen baselines before and after swap
- [ ] Re-run full visual regression suite after WebP wiring; all 29 screens must pass at ≤2% diff
- [ ] Run Lighthouse locally against dev server after WebP wiring
- [ ] Run Lighthouse against deployed environment (FCP, LCP, CLS, INP targets: all green)
- [ ] Reduce initial transfer size (target: <200KB image transfer on first load)
- [ ] Evaluate route-level code splitting to reduce 2,625 KB main bundle
- [ ] Confirm original approved assets in `public/approved/` remain untouched after all above
- [ ] Update asset registry (`smokecraftAssetRegistry.js`) to reference WebP canonical paths where active
- [ ] Document Lighthouse before/after for investor follow-up deck

---

## R17 — Database Rollback Live Verification (Complete the PARTIAL)

- [ ] Provision approved isolated Postgres test environment (never production)
- [ ] Run all 72 forward migrations in sequence against the test environment
- [ ] Insert isolated, non-production test data covering all smoke_sessions, scorecards, passport records
- [ ] Test forward migration from clean state to migration 072
- [ ] Test full rollback from 072 to 001 using `rollback-master.mjs --all`
- [ ] Test partial rollback (e.g., --from 072 --to 060) and verify data integrity
- [ ] Test recovery: re-apply forward migrations after rollback
- [ ] Verify backup procedure: snapshot before rollback, restore from snapshot, verify consistency
- [ ] Document DBA authorization chain: who approves live rollback, under what conditions
- [ ] Add rollback runbook to `docs/smokecraft/10-rollback-recovery.md`
- [ ] Never test rollback directly against production first — always isolated environment first

---

## Production Readiness

- [ ] Provision production monitoring provider (e.g., Sentry, Datadog) — integrate with `smokecraftErrorLogger.js` flush transport
- [ ] Activate production Postgres database — run migrations in order, verify schema matches migration 072
- [ ] Live POS360 provider activation — replace demo stub with credentialed provider; validate order flow end-to-end
- [ ] Live E.A.T. persistence — activate E.A.T. backend, wire `managementSyncStatus` to real sync events
- [ ] Live humidor provider configuration — register device ID, activate `humidorConnectionStatus` against real hardware
- [ ] Activate `DATABASE_URL` in production environment and re-verify session persistence end-to-end

---

## Quality and Security

- [ ] Load testing — simulate concurrent guest sessions at target venue capacity; establish baseline RPS
- [ ] Penetration testing — OWASP Top 10 audit on all SmokeCraft API routes; rate limiting, input validation, auth bypass
- [ ] Disaster-recovery exercise — simulate DB failure, Vercel outage, integration provider downtime; document recovery time
- [ ] GA performance hardening — achieve Lighthouse green on all core web vitals in deployed environment

---

## Notes

- These tasks must not delay the investor freeze
- Visual regression baselines in `visual-regression-baselines/` are the reference point for all post-investor visual work
- Any change touching frozen assets requires regression approval and full re-run before merge
