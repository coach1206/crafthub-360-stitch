# SmokeCraft Main-Based Integration — Owner Acceptance Checklist

**Branch:** `integration/smokecraft-main-candidate`
**Main base SHA:** `af3956bb0eacb8fff5bb285951fb0247399f1e1a`
**Recovery source SHA:** `84f96015dcf7784982b6418546558baae1a1bb51`
**Integration tested SHA:** `7eb202aa79263dddc008d9198009cfd4e187325e`
**Status: NOT MERGED. NOT DEPLOYED. NOT OWNER-APPROVED.**

| # | Check | Result |
|---|---|---|
| 1 | Canonical journey lock (24 checkpoints) | ✅ PASS 24/24, 0 defects |
| 2 | Required-interaction gates (Final Third flavor-chip, Scorecard 6-category) | ✅ PASS — both confirmed to genuinely block on zero input |
| 3 | Route-bypass guard (direct nav to a locked screen) | ✅ PASS — redirects to Identity |
| 4 | Back-button behavior | ✅ PASS |
| 5 | Resume/persistence across reload | ✅ PASS |
| 6 | Dead-end check (Session Complete exposes real controls) | ✅ PASS — 9 visible controls |
| 7 | 14-screen visual proof, regenerated from integration branch | ✅ PASS — premium, consistent, no broken images, no dead space |
| 8 | Full real-browser journey trace (entry → Session Complete) | ✅ PASS — 29 steps, 0 stalls |
| 9 | 5-viewport responsive proof | ✅ PASS — 160/160 combinations, 0 failures |
| 10 | Database migration safety (disposable DB, idempotent, non-destructive) | ✅ PASS |
| 11 | No screenshot-hotspot architecture reintroduced | ✅ PASS — main's old-style screens were superseded, not extended |
| 12 | server/index.js reconciled additively (not overwritten) | ✅ PASS |
| 13 | Only genuinely-required dependencies added | ✅ PASS — express-rate-limit (runtime), sharp (tooling only) |
| 14 | Railway deployment status | ⛔ **NOT VERIFIABLE** — no Railway CLI or credentials available in this environment (genuine external blocker) |
| 15 | Vercel/frontend deployment status | ⛔ **NOT VERIFIABLE** — same blocker |
| 16 | Documentation reflects actual integration-branch state | ✅ PASS — this checklist, dependency closure, migration map, and change manifest all generated from the real diff/logs of this session, not stale recovery-era claims |

## Real defects found and fixed this session (not merely reported)

1. Missing `/api/smokecraft/player-state` routes — stalled journey at Humidor Match (S2)
2. Missing `/api/smokecraft/pairing-engine` route — stalled journey at Pairing Recommendations (S22)
3. Missing `pairingType` field in the frontend's pairing-engine request payload — pre-existing bug in the ported source, second half of the same stall
4. Missing `smokecraft_progression_events` table — third and final root cause of the same stall (42P01 undefined_table on every pairing-engine call)
5. Missing `venues`/`venue_memberships`/`venue_permissions` tables — broke Management Sync entirely
6. 62 missing image assets, including the one causing FlavorMemory.jsx to render raw broken-image alt text
7. Two visual dead-space defects (Connections, Second Humidor Match) found during self-QA and fixed with real content sections
8. A trailing-slash string-comparison bug in the canonical-journey test script itself, present in two separate locations
9. Three stale/missing selectors in supporting test scripts (Identity's removed `identity-begin` testid, `Alpha Lounge (Seed)`'s missing venue-select fallback in two scripts)

## Genuine unresolved blocker

**Deployment verification (Railway/Vercel).** This sandboxed session has no deployment CLI, no Railway/Vercel credentials, and no network path to check real production status. This cannot be fabricated as a PASS. It requires either credentials being supplied to this environment or the check being run from an environment that has them.

## Explicit non-status

This candidate is **NOT MERGED** into `main` or `recovery/smokecraft-codex-final`, **NOT DEPLOYED**, and **NOT OWNER-APPROVED**. Owner-approved status belongs solely to the repository owner.
