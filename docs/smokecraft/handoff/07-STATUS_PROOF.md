# SmokeCraft 360 — Status / Proof (Doc 7 of 10)

**Status: NOT MERGED into `main`. NOT DEPLOYED. NOT OWNER-APPROVED.**
This is consolidated from existing, already-verified reports on this branch —
nothing below was re-run for this handoff pass unless explicitly marked
"re-verified in this pass."

## Integration-level checks

Source: `docs/smokecraft/integration/MAIN_INTEGRATION_ACCEPTANCE_CHECKLIST.md`
(Main base SHA `af3956bb0`, integration-tested SHA `7eb202aa7`)

| # | Check | Result |
|---|---|---|
| 1 | Canonical journey lock (24 checkpoints) | ✅ PASS 24/24, 0 defects |
| 2 | Required-interaction gates (Final Third flavor-chip, Scorecard 6-category) | ✅ PASS |
| 3 | Route-bypass guard (direct nav to a locked screen) | ✅ PASS — redirects to Identity |
| 4 | Back-button behavior | ✅ PASS |
| 5 | Resume/persistence across reload | ✅ PASS |
| 6 | Dead-end check (Session Complete exposes real controls) | ✅ PASS — 9 visible controls |
| 7 | 14-screen visual proof, regenerated from integration branch | ✅ PASS |
| 8 | Full real-browser journey trace (entry → Session Complete) | ✅ PASS — 29 steps, 0 stalls |
| 9 | 5-viewport responsive proof | ✅ PASS — 160/160 combinations reported (see gap note below) |
| 10 | Database migration safety (disposable DB, idempotent, non-destructive) | ✅ PASS |
| 11 | No screenshot-hotspot architecture reintroduced | ✅ PASS |
| 12 | `server/index.js` reconciled additively | ✅ PASS |
| 13 | Only genuinely-required dependencies added | ✅ PASS |
| 14 | Railway deployment status | ⛔ NOT VERIFIABLE — no Railway CLI/credentials in this environment |
| 15 | Vercel/frontend deployment status | ⛔ NOT VERIFIABLE — same blocker |
| 16 | Documentation reflects actual integration-branch state | ✅ PASS |

## Canonical journey lock — real-browser trace

Source: `docs/smokecraft/journey-lock-proof/CANONICAL_JOURNEY_LOCK_REPORT.json`
(SHA `19c70fb72`)

- 24/24 checkpoints visited **and** route-matched, in order, `canonicalJourneyPass: true`, `orderMatches: true`, `defects: []`
- Bypass check: direct nav to `/smokecraft/scorecard` with zero progress → redirected to `/smokecraft/identity` ✅
- Back-button check on Venue Select → correctly returns to Identity ✅
- Resume/persistence check: reload on Welcome kept the same route ✅
- Final Third gate: Continue did not advance with zero selection ✅
- Scorecard gate: Continue did not advance with zero ratings ✅
- Dead-end check: Session Complete exposes 9 visible controls ✅

## Owner-rebuild visual pass — most recent work on this branch (re-verified in this handoff pass)

Source: `docs/visual-proof/migration/SMOKECRAFT_ONE_SYSTEM_FINAL_REPORT.json`
(commit `bf0a00bb4`, this doc's cross-check confirms the same 14/14 pass held
after the subsequent CSS-stacking fix and baked-title fix, both landed in
commit `bdf8ae5e1`)

- 28 screenshots across 2 viewports (tablet-primary 1180×820, tablet-secondary
  1024×768)
- `allScreensPass: true`
- All 14: `identity` `seed-soil` `format` `cut-toast-light` `first-third`
  `second-third` `final-third` `scorecard` `request-purchase`
  `pairing-recommendations` `passport-stamp` `connections` `rewards`
  `second-humidor-match` — every one `PASS (NONE)`, `routeStayed: true` at
  both viewports
- Overlap check on every screen: `controlsHiddenBehindNav: 0`

This specific run was re-executed twice more during the CSS-stacking fix and
the baked-title-crop fix (same script, same branch), with the same
`allScreensPass: true` result each time — confirmed live in this session, not
carried forward from an older report.

## Integration candidate report — full summary

Source: `docs/smokecraft/integration/MAIN_INTEGRATION_CANDIDATE_REPORT.json`

| Check | Result |
|---|---|
| CODE | PASS |
| FUNCTIONAL | PASS |
| VISUAL | PASS |
| RESPONSIVE | PASS |
| 43-screen full journey | PASS |
| INTEGRATION | PASS |
| RAILWAY | NOT VERIFIABLE (no credentials/CLI) |
| VERCEL / FRONTEND | NOT VERIFIABLE (same blocker) |
| DOCUMENTATION | PASS |
| OWNER ACCEPTANCE | NOT READY — deployment status unverified; owner sign-off is the owner's alone regardless |

## Known gaps in the proof record (honest, not glossed over)

1. **The "160/160 5-viewport responsive proof" and "43-screen full journey
   PASS" claims in the integration checklist/report are summary claims from
   an earlier session** — the per-viewport / per-screen raw artifacts backing
   those two specific numbers were not found as standalone files in
   `docs/` at the time this handoff package was written. The 14-screen,
   2-viewport proof in `docs/visual-proof/migration/` (28 screenshots) *is*
   present and was re-verified live in this handoff pass; it is a real
   subset of, not identical to, those two broader claims.
2. **Not all screens in doc 02/04 have a dedicated, current contact sheet.**
   The 14-screen proof covers the owner-rebuild set. Spine/supporting-module
   screens outside that set (Welcome, Meet Your Cigar, Terroir, Lighting
   Tutorial, Mentor Commentary, Knowledge Drop, AI Summary, Final Review,
   Session Complete, Golden Box, Mentor Selection, Wrapper/Strength, Mini
   Tasting, SmokeCraft Challenge) are routed and were included in the
   24-checkpoint canonical-journey trace (which confirms *reachability and
   navigation*, not per-screen visual regression proof at multiple
   viewports).
3. **Deployment status (Railway/Vercel) has never been verifiable from any
   session working this branch** — no CLI or credentials have been available
   in any sandboxed environment used so far. This is a real, standing
   external blocker, not a task left undone.

## Explicit non-status (repeated deliberately in every document of this package)

This branch is **NOT MERGED** into `main` or `recovery/smokecraft-codex-final`,
**NOT DEPLOYED**, and **NOT OWNER-APPROVED**. Owner-approved status belongs
solely to the repository owner.
