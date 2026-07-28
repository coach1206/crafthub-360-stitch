# Holistic Fix 5B-1 — Proof Index

Starting commit: `31fa6f0b`.

## Pairing routes audited

Existing (audited, left untouched — different systems, explicitly out
of scope): `server/controllers/smokecraftPairingController.js`
(`/api/modules/smokecraft/pairing/*`, Module Build 4 intelligence
module — already server-side but not wired to any active screen),
`server/controllers/flavorPairingController.js`
(`/api/smokecraft/flavor-pairing/*`, Package 6 — real, DB-backed,
already correctly used by its own screens), `server/routes/pairingOrderRoutes.js`
(trivial in-memory demo, unrelated to cigar+beverage pairing).

New this pass: `server/routes/pairingEngineRoutes.js`
(`/api/smokecraft/pairing-engine/*`); client screens
`src/pages/smokecraft/PairingLab.jsx` (`/smokecraft/pairing-lab`, S11)
and `src/pages/smokecraft/PairingRecommendations.jsx`
(`/smokecraft/pairing-recommendations`, S22).

## Mock/client logic found and removed

Both real, reachable pairing screens (S11 and S22) computed their
compatibility score **entirely client-side** via
`src/utils/pairingEngine.js`'s `buildRecommendation`/`rankAllCategories`
— a real, honest, non-AI rule engine, but never server-verified,
never versioned, never persisted server-side, and trivially
tamperable. This was the actual "mock/client logic" this mandate
targets — not fabricated data, but client-authoritative scoring.
Closed: both screens now call the new server-authoritative engine via
the shared `useSmokeCraftPairingEngine` adapter; the client-only
`buildRecommendation`/`rankAllCategories` call sites were removed from
both screens (the underlying data constants they were built from —
`STRENGTH_SCORE`/`TYPE_STRENGTH`/`HARMONY`/`GOAL_DESC`/`ADJUSTMENT_MAP`/
`SERVING_STYLE` — are reused, not discarded, now server-side).

## Cigar data model result

Real fields only: `cigarShape` (vitola), `wrapper`, `origin`,
`strength` — the exact set already collected by `PairingLab.jsx`
before this pass. No ring gauge, binder, filler, or smoking-duration
field was invented (none exist in this abstract-selector pairing
model).

## Beverage data model result

Real fields only: `pairingType` (category), each with a known
intensity score and known harmony/clash flavor-note lists. No
sweetness/acidity/bitterness/body/finish/serving-style attribute was
invented (none exist in this pairing model — `SERVING_STYLE` is a real
serving-instruction map, not a beverage attribute).

## Rules implemented

4 versioned rules (rule set version 1), stored in
`smokecraft_pairing_rules` — see `SMOKECRAFT_PAIRING_ENGINE_RULES.md`
for the full table. Direct port of the pre-existing approved scoring
logic, now server-authoritative and explainable.

## Scoring result

PASS — deterministic (verified live: identical input → identical
`compatScore` and `ruleSetVersion` across repeated requests), never
client-influenced (verified live: a client-submitted `compatScore`/
`ruleSetVersion` in the request body is silently ignored, the server
always recomputes its own).

## Explanation result

PASS — every response includes a non-empty `explanation`, a
`servingSequence`, and (for `/recommend`) an `alternative`
recommendation. No unexplained result is possible (enforced by the
build-blocking validator).

## Conflict detection result

PASS — verified live: a Mild cigar against Whiskey (intensity 1 vs. 4)
reports `intensityMatch: 'mismatched'` and a real conflict string;
selected flavor notes that clash with the pairing type are flagged by
name, not silently dropped.

## Saved-pairing result

PASS — verified live: save → reload → identical server-computed
score; duplicate save (same idempotency key) is a true no-op (no
version bump, no new revision — closed a real defect found during this
pass's own test-writing, see Defects below); a different natural-key
combination does not collide with an unrelated saved pairing.

## Revision-history result

PASS — verified live: each real rating/notes update appends a new
`smokecraft_pairing_save_revisions` row (2+ revisions confirmed after
2 real edits); the table has no update-in-place path at all (no
`updated_at` column exists on it — append-only by construction, not
just by convention).

## Cross-device result

PASS — verified live: two independent live fetches of
`GET /saved` under the same identity return identical data (no
per-device local mirror to desync).

## Account-conversion result

PASS — verified live: a guest saves a pairing, creates a real account,
converts, and the same saved pairing (with full revision history) is
visible under the new account identity
(`pairingSavesTransferred: 1` on the conversion response). Wired from
day one via `transferSavedPairings`, called from
`convertGuestToAccount`.

## Authorization result

PASS — verified live: a completely separate guest gets a uniform 404
(not 403) when requesting another guest's saved pairing by ID —
existence is never leaked; the separate guest's own `GET /saved` list
never includes the other guest's row; a rate/update attempt against
another guest's saved pairing is rejected.

## Defects found and fixed

- **SC-D044**: `SERVING_STYLE` was defined but not exported from
  `src/utils/pairingEngine.js`, breaking the server-side dual-import —
  closed (now exported, no scoring-behavior change).
- **SC-D045**: `transferSavedPairings`'s JSONB columns
  (`flavor_notes`/`matched_flavor_notes`/`conflicts`) were passed as
  raw JS arrays instead of `JSON.stringify`-ed strings during guest-
  to-account transfer, causing every conversion with a saved pairing to
  fail with an internal error — closed, found and fixed during this
  pass's own live testing before any automated test was written against
  it.
- **SC-D046**: the initial `savePairing` implementation treated an
  exact idempotency-key retry as a natural-key `ON CONFLICT DO UPDATE`
  (bumping `save_version` and appending a new revision on every
  identical resubmission) instead of a true no-op — closed by adding an
  early idempotency-key lookup that short-circuits before any write.

## Tests and build

`verify-smokecraft-hf5b1-pairing-engine.mjs`: 36/36.
`validateSmokecraftPairingEngineAuthority.mjs`: 25/25 (wired into
prebuild). Regression re-verified clean: HF4 30/30, HF4B 32/32, HF5A-3
5/5, HF5A-3D 13/13, HF5A-3E 11/11, HF5A-3F 19/19, HF5A-3G 22/22,
HF5A-3H 25/25. `npm run build` (19 prebuild validators + vite build):
clean. Live route smoke: `GET /smokecraft/pairing-lab` and
`GET /smokecraft/pairing-recommendations` both 200 on a fresh session.

## Proof path

`public/proof/smokecraft-holistic-fix-5b-1/`

## What this pass does NOT cover (handoff to 5B-2)

- Mentor voices, Challenge Hub, Golden Box — untouched per explicit
  mandate exclusion.
- The separate, already-real Module-Build-4 pairing intelligence module
  (`smokecraftPairingController.js`, `/api/modules/smokecraft/pairing/*`)
  and Package 6's flavor-pairing system
  (`flavorPairingController.js`) were audited but intentionally NOT
  consolidated into this new engine — they are different, already-
  working systems serving different screens, and merging them was not
  requested by this mandate.
- No XP/badge/Passport-stamp reward wiring was added for pairing
  activity (explicit mandate instruction).
- A deep Playwright browser-render smoke test of the two screens was
  not run (only HTTP-level route/API smoke) — full five-viewport sweeps
  were explicitly excluded by this mandate; a future pass wanting true
  visual regression coverage for the pairing screens would need to add
  one.
- The full 109-route/five-viewport sweeps were not run, per this
  mandate's own instruction.
