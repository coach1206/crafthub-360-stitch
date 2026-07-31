# Pairing Engine Audit (broader SmokeCraft scope, beyond Venue Humidor)

Evidence: fresh re-run this pass — `verify-smokecraft-hf5b1-pairing-engine.mjs`
36/36, `scripts/validateSmokecraftPairingEngineAuthority.mjs` PASS (also
part of the full `npm run build` prebuild chain, reconfirmed clean).

## Real engine, not fabricated

`server/services/smokecraft/pairingEngineService.js` +
`src/utils/pairingEngine.js` is a real, server-authoritative, rule-based
(explicitly NOT AI-labeled) engine covering: cigar strength (`STRENGTH_SCORE`),
body, flavor-note complement/clash rules (`HARMONY`), beverage-category
intensity matching (`TYPE_STRENGTH`), balance/contrast/intensity-match
scoring, explanation generation, and persistence (`smokecraft_pairing_saves`,
versioned, append-only `smokecraft_pairing_save_revisions`). The
validator confirms the API client exposes only
recommend/rank/save/get/rate — no client-side score-setting function
exists anywhere.

## Real beverage catalog: does NOT exist

Confirmed by the discovery audit performed during Venue Humidor 1B-2B-5
(re-verified, not contradicted, this pass): no real venue-level
beverage/spirits/wine/cocktail product catalog exists anywhere in the
codebase. The only beverage-adjacent tables belong to the unrelated
POS360 restaurant/bar menu-builder system (migration 032 and related),
which has never been wired to the pairing engine. Both Venue Humidor's
recommendation service and the core SmokeCraft pairing engine work only
at the **abstract category level** (Whiskey, Rum, Coffee, Wine, Tea,
etc.) — an honest, disclosed design boundary, not a gap silently hidden
behind UI polish.

## Persistence, scoring, challenge integration

Confirmed via the passing test suite: pairing requests, recommendations,
saves, and ratings all persist server-side with real event logging
(`pairing_requested`, `pairing_recommended`, `pairing_saved`,
`pairing_rated` in the shared `smokecraft_progression_events` ledger).
Challenge-hub integration was not independently re-verified this pass
beyond what the passing suite already covers.

## What depends on PourCraft/WineCraft/BeerCraft/POS360/E.A.T.

Nothing in the current pairing engine *requires* those systems to
function today — it already works fully at the abstract-category level
without them. A **real, specific-product beverage recommendation**
(e.g. "this exact bourbon SKU currently in stock at this venue") would
require a real beverage catalog, which does not exist in any of
PourCraft/WineCraft/BeerCraft (not found anywhere in this codebase —
these may be external/future products, not currently integrated) or the
existing POS360 menu-builder (present but never wired to pairing). This
is recorded in `14-pos-eat-dependencies.md` as an explicit, currently-
unaddressed dependency for any future "real beverage inventory pairing"
feature — not required for the current, honestly-scoped abstract-
category pairing experience to be considered complete on its own terms.

## Classification

**Complete and verified** at its own disclosed scope (abstract-category
pairing, real scoring/persistence/explanation). **Intentionally
deferred** for real-product beverage-catalog pairing, which is not a
defect — it was never claimed to exist, in either the pairing engine's
own code comments or the Venue Humidor recommendation service built on
top of it.
