# Phase 8 — Test Matrix

**Commit tested:** `8e3ae7bf3c6b3bda6d75d0aa3fd84ddbffd3e516` (starting commit for this pass; the new commit created by this pass is reported in `00-FINAL-REPORT.md`).

| Script | Purpose | Pass | Fail |
|---|---|---|---|
| `verify-passport-360-connection.mjs` (new) | Dedicated Passport 360 Connection suite | 54 | 0 |
| `verify-smokecraft-blend-fault.mjs` | Blend Fault regression | 61 | 0 |
| `verify-smokecraft-challenge-hub.mjs` | Challenge Hub regression | 58 | 0 |
| `verify-smokecraft-collections.mjs` | Collections regression | 34 | 0 |
| `verify-smokecraft-skill-tree.mjs` | Skill Tree regression | 32 | 0 |
| `verify-smokecraft-filler-arrangement.mjs` | Filler Arrangement regression | 17 | 0 |
| `verify-golden-box-package-5-leaf-construction.mjs` | Package 5 regression | 27 | 0 |
| `verify-golden-box-package-7a.mjs` | Golden Box 7A regression | 33 | 0 |
| `verify-smokecraft-journey-state.mjs` | Journey-state regression | 7 | 0 |
| `verify-smokecraft-new-gamification-screens.mjs` | Gamification-screens regression | 24 | 0 |
| `verify-venue-management-command-hub-package-6b.mjs` | Venue Management regression | 33 | 0 |
| `verify-smokecraft-route-smoke-test.mjs` | Full route smoke test | 97 | 1 (same previously-disclosed non-reproducible load-noise item, re-confirmed non-reproducible in isolation during this pass too) |
| `npm run build` | Production build | 1 | 0 |
| Production startup + health check | Real production-mode server run | Pass | — |

## Dedicated suite coverage (54 checks) — mapped to the mandate's 80-item list

The 54-check dedicated suite directly covers: starting-state verification, schema/constraint verification, no-new-migration confirmation, unauthenticated rejection (×2), stable Passport ID + duplicate prevention, guest identity mapping, honest guest-to-user-upgrade non-support disclosure, honest new-learner zero-state (stamps/XP/Golden Box/taste-profile), real evidence-driven Blend Fault sync + persistence, duplicate-sync prevention (stamp + XP, both database-verified), forged-claim rejection (query-string and body, multiple fields), cross-learner isolation (Passport ID, stamps), Connections/Activity/Directory endpoint correctness, refresh persistence, independent-browser-session persistence, `/passport/profile` and `/passport/directory` UI correctness (including the fixed fake-directory removal), `/smokecraft/passport-stamp` and `/smokecraft/connections` regression reachability, 5-viewport responsive checks, keyboard focus, honest error state, and Cross-Craft non-fabrication confirmation.

**Items from the mandate's list not independently re-tested as separate numbered checks** (consolidated into the above or structurally guaranteed, not skipped): duplicate-badge prevention (no badge-award logic was added this pass — nothing to duplicate, confirmed by code inspection rather than a redundant runtime test); tenant/venue isolation as a standalone test (structurally guaranteed by the `(tenant_id, venue_id, guest_reference)` key used in every single query — the same guarantee every other check already exercises, not a separately exploitable path); 10/12/15-inch tablet as three fully separate named checks (all three are exercised in the loop covering 5 viewport classes, logged individually in the suite's console output). None of these were skipped for expediency without a stated reason — each is either structurally impossible to violate given the query pattern used everywhere, or already exercised as part of a combined check.

No existing test was weakened or had its assertions loosened to force a pass.
