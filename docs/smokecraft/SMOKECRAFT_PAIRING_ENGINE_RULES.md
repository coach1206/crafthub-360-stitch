# SmokeCraft Pairing Engine Rules — Holistic Fix 5B-1

Generated: Holistic Fix 5B-1, starting commit `31fa6f0b`.

## Data source

`POST /api/smokecraft/pairing-engine/recommend`, `POST .../rank`,
`POST .../save`, `GET .../saved`, `GET .../saved/:id`,
`PUT .../saved/:id/rate` — a real, server-authoritative engine
(`server/services/smokecraft/pairingEngineService.js`, migration 098).
**No mock, hardcoded, or AI-labeled recommendation exists anywhere in
this engine or its client consumers** (`PairingLab.jsx`,
`PairingRecommendations.jsx`, both wired through the one shared
`useSmokeCraftPairingEngine` adapter).

## Canonical pairing input model

This pass does **not** invent cigar or beverage facts beyond what is
already approved and in active use by the existing pairing screens.
Real fields used (all already collected by `PairingLab.jsx` before this
pass, now scored server-side instead of client-side):

**Cigar side:** `cigarShape` (vitola), `wrapper`, `origin`, `strength`.
**Beverage side:** `pairingType` (beverage/food category — Whiskey, Rum,
Coffee, Espresso, Wine, Chocolate, Tea, Water, Mocktail, Nonalcoholic,
Nuts), each with a known intensity score and a known harmony/clash
flavor-note list.
**Shared:** `flavorNotes` (learner-selected), `pairingGoal`
(Complement/Contrast/Soften/Brighten/Deepen Finish/Explore New Notes).

Fields explicitly NOT represented (they do not exist anywhere in this
game's approved data model — binder/filler/ring gauge/smoking duration
for cigars, or sweetness/acidity/bitterness/body/finish/serving-style
attributes for beverages): intentionally absent, not fabricated.

## Versioned rules (rule set version 1)

Stored in `smokecraft_pairing_rules` (migration 098), each with a real
`rule_key`, `version`, `active` flag, condition summary, weight, and
`explanation_text`:

| Rule | Condition | Effect |
|---|---|---|
| `strength-intensity-balance` | cigar strength vs. beverage intensity (1–4 scale) | −12 per step of mismatch |
| `flavor-note-harmony` | selected notes match the pairing type's harmony list | +6 per matched note |
| `flavor-note-clash` | selected notes match the pairing type's clash list | −10 per clashing note |
| `origin-strength-hold` | origin present + strength ≥ Medium-Full | +4 |

This is a direct, versioned port of the pre-existing, already-approved
rule-based logic in `src/utils/pairingEngine.js` (`STRENGTH_SCORE` /
`TYPE_STRENGTH` / `HARMONY` / `GOAL_DESC` / `ADJUSTMENT_MAP` /
`SERVING_STYLE`) — scoring behavior for real users is unchanged, it is
now server-authoritative, explainable, and versioned instead of
client-computed and untracked.

## Scoring outputs (every response)

`compatScore` (30–100), `balanceScore`, `contrastScore`,
`intensityMatch` (`even`/`close`/`mismatched`), `confidence` (0.2–1.0,
derived from how much real signal was provided), `matchedFlavorNotes`,
`conflicts` (plain-language list — never silent), `explanation` (always
non-empty), `servingSequence` (draw pacing + serving style, from the
same approved `ADJUSTMENT_MAP`/`SERVING_STYLE` data), `alternative`
(the best-scoring different category for the same cigar, computed the
same way, never a second/competing scoring path).

## Explainability rule

Every response's `explanation` covers: why the flavor notes connect (or
don't), the strength/intensity balance, the pairing goal's real effect,
and origin's role when present. `conflicts` is a real array (empty when
none), never omitted. No unexplained AI-style output exists — this
engine is explicitly rule-based, matching the pre-existing product
disclosure in `pairingEngine.js`.

## Persistence / correction-adjacent behavior

`smokecraft_pairing_saves` (migration 098) is the sole owner of a
saved pairing: `guest_reference` (ownership), the full input, every
scoring output, `rule_set_version`, `learner_rating`, `learner_notes`,
and `save_version` (optimistic concurrency). A real
`UNIQUE(guest_reference, cigar_shape, wrapper, origin, strength,
pairing_type)` constraint makes duplicate saves impossible at the DB
level; a real `UNIQUE(idempotency_key)` plus an early idempotency-key
lookup makes an exact retry a true no-op (no version bump, no new
revision). `smokecraft_pairing_save_revisions` is append-only (no
`updated_at`/edit path exists on it at all) — every save/rate mutation
snapshots the pre-change row there first.

## Ledger events

`pairing_requested`, `pairing_recommended`, `pairing_saved`,
`pairing_rated` — all written via the existing, reused
`smokecraft_progression_events` table (migration 085), not a new
competing event log. **No XP, badge, or Passport stamp is granted by
this package**, per the mandate's explicit instruction — this pairing
engine's rewards are entirely out of scope for 5B-1.

## Guest/account, cross-device, ownership

`convertGuestToAccount` transfers every saved pairing (evidence +
revision history) to the new account identity on conversion
(`transferSavedPairings`, wired from day one — this is a brand-new
system with no chance to accumulate the "never transferred" defect
class found repeatedly in earlier passes). `getSavedPairing` enforces
ownership at the query level (`WHERE id = $1 AND guest_reference =
$2`) and returns a uniform 404 for both "does not exist" and "not
yours" — existence is never leaked to a non-owner.

## What this pass does NOT include

Mentor voices, Challenge Hub, Golden Box, and the separate Golden-Box
competition pairing surfaces (`server/services/goldenBox/flavorPairingService.js`,
Package 6's `smokecraft_pairing_drafts`) — untouched, explicitly out of
this mandate's scope, and not consolidated into this new engine. The
full 109-route/five-viewport sweeps were not run, per this mandate's
own instruction.
