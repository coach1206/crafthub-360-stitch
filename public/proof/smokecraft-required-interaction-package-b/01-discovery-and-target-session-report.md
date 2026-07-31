# 01 — Discovery and Target-Session Report

**Starting commit:** `7eb3f54a`

## Canonical sources consulted before any implementation

- `src/constants/smokecraftRequiredInteractions.js` (the canonical manifest)
- `public/proof/smokecraft-required-interaction-manifest-audit/12-implementation-package-plan.md`
- `public/proof/smokecraft-required-interaction-manifest-audit/04-session-by-session-product-decisions.md`
- `public/proof/smokecraft-required-interaction-manifest-audit/05-21-session-implementation-audit.md`
- `public/proof/smokecraft-required-interaction-manifest-audit/06-backend-ownership-map.md`
- Existing source: `src/pages/smokecraft/Scorecard.jsx`, `server/routes/smokecraftScorecardRoutes.js`, `server/services/smokecraft/playerStateService.js`, `server/services/smokecraft/tastingObservationService.js` (Package A precedent)

## Target session

**Session 19 only** — `sessionId: 'scorecard'`, route `/smokecraft/scorecard`, component `Scorecard.jsx`. Package B in `12-implementation-package-plan.md` names exactly this one session ("Multi-Category Rating Server Authority").

## Existing scorecard components found

- `src/pages/smokecraft/Scorecard.jsx` — real 6-category rating UI (Appearance/Construction/Draw/Burn/Flavor/Pairing Match), each 1-5 dots, plus session-meta fields (duration/puff count/relights) and personal notes.

## Existing backend ownership found (the actual gap)

- `server/routes/smokecraftScorecardRoutes.js`, mounted at `/api/smokecraft/scorecard` with **no auth middleware, no identity verification, no rate limiting**. Its `POST /submit` accepted an arbitrary client-supplied `guestId` string and wrote to an **in-memory `Map`**, explicitly self-labeled `persistenceMode: 'memory_fallback'` — lost on every server restart, never scoped to a real player, never connected to XP/completion/progression. The completion flow (`awardSessionRewards('scorecard')` → generic `completeSession()`) never checked whether this endpoint had even been called. This exactly matches the audit's finding in `06-backend-ownership-map.md`: *"Scorecard rating (19) | none dedicated | `GuestSessionContext.jsx` local reducer only | local state only"*.

## Owner-decision resolution

`04-session-by-session-product-decisions.md` flagged one narrow open question for Session 19: *"exact 'correctness' contract still an owner decision if scoring (vs. persistence-only) is desired."* This mandate's own **SERVER AUTHORITY** and **SCORECARD REQUIREMENTS** sections resolve it: a cigar-quality rating is inherently subjective (there is no objectively "correct" appearance/draw/burn score), so — exactly as Package A already established for tasting observations — "server evaluation" means the server independently validates that a complete, well-formed, in-range rating was submitted (never trusting a client-computed "done" flag), and the server computes and owns the weighted overall score itself. This directly reuses Package A's evidence-ledger pattern rather than building a second contract, satisfying the mandate's explicit "do not build a second scoring system" instruction. No implementation proceeded on any *other* unresolved owner decision (Packages C/D/E/F sessions were not touched).

## Canonical sources agreement

All sources agree: Session 19 is the sole Package B target, its interaction type is `multi-category-rating`, and its gap is "no dedicated server-side evaluation/persistence, local state only." No disagreement was found between the manifest, the audit, and the actual source code — proceeded with implementation.
