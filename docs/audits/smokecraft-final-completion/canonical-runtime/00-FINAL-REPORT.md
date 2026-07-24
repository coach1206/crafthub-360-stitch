# 00 — Final Report: Canonical Runtime and Sequence Reconstruction (Prompt 1 of 2)

**Repo/branch:** `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
**Starting commit:** `2c1abab3095b4afb904a801fcbbc090e9f7a9e95` — verified local=remote, clean tree, before this pass.

## Scope decision, made explicit with the user before writing code

This mandate requested replacing all 21+ independently-built, working, extensively-regression-tested SmokeCraft screen components with thin wrappers driven by one new generic `SmokeCraftScreenRenderer`. Given ~10 prior passes' independent traces of this codebase repeatedly found single-source-of-truth patterns already in place per concern (one session registry, one guard, one journey-status function, one entry-readiness function, one asset registry), a full 27-screen rewrite in one pass was flagged as high-risk before starting. The user selected **"scoped middle ground"** for the first half of this pass: build the new canonical layers as real, working, additive infrastructure, and migrate one representative screen (session-21, AI Summary) to prove it.

**Update — full migration completed:** the user subsequently required the remaining 26 screens be migrated before Prompt 2 could begin. That work is now done — all 27 curriculum sessions route through the canonical runtime. See the "Full migration completion" section below for what changed and how session-5 (Format)'s one genuine non-linear branch was handled.

## Root cause

No genuinely conflicting production-reachable definition was found (see `02-COMPETING-DEFINITIONS.md`). The real, accurate finding: 27 screens each correctly duplicate the same "persist → award → navigate" pattern inline, rather than calling one shared function — duplication, not competition.

## Competing definitions found

None production-reachable. Re-confirmed dead: `SMOKECRAFT_FLOW`, `JOURNEY_STEPS`, `smokecraftRewards.js` stale metadata (all previously deprecated), `SmokeCraftModule.jsx` (previously confirmed dead). Newly checked and confirmed dead this pass: `Format.legacy.jsx`.

## Legacy production components found

None beyond the above, all already dead/unreachable before this pass.

## Hardcoded routes found

All 27 screens hardcode their own next-route string inline. Cross-checked this pass: every one matches `VISIT_STRUCTURE`'s real order exactly — no incorrect hardcoded route was found, only the architectural duplication itself.

## Canonical manifest / registry / renderer / data selector / completion service / interaction manifest paths

`src/constants/smokecraftScreenManifest.js`, `src/constants/smokecraftComponentRegistry.js`, `src/components/smokecraft/SmokeCraftScreenRenderer.jsx`, `src/services/smokecraft/smokecraftScreenDataSelector.js`, `src/services/smokecraft/smokecraftCompletionService.js`, `src/constants/smokecraftInteractionManifest.js` — all new, all real, all covered by `verify-smokecraft-canonical-runtime.mjs` (19/19 pass).

## Zero-legacy result

`verify-smokecraft-zero-legacy-runtime.mjs` — 9/9 pass. No duplicate route, no fallback silently replacing AI Summary, no residual "Continue to Personal Dashboard" defect.

## Welcome / Identity / Humidor Match / Golden Box results

**Migrated.** Welcome (session-1) and Humidor Match (session-2) now route through `SmokeCraftScreenRenderer`, live-verified with correct markers and preserved navigation. Identity is an entry-layer screen (not a numbered curriculum session) and remains on its existing, already-correct wiring, consistent with the manifest's entry/curriculum split. Golden Box is a supporting module (`SUPPORTING_MODULES`, outside the 27-session numbered spine) and is unaffected by this migration, per the mandate's own scope note that supporting modules are not part of `TOTAL_SESSIONS`.

## Session 1–27 runtime result

All 27 curriculum sessions now migrated through the canonical runtime. 26 route through `SmokeCraftScreenRenderer` with a standard manifest-driven `nextScreenId` chain (merged sessions S9/S13/S17/S18/S20/S26 share their primary session's route/component, covered implicitly). Session-5 (Format) is also migrated, but carries its one real, approved non-linear branch (forward to `request-purchase`, not S6, plus an extra `wrapper-strength` award) via a new `nextRouteOverride` manifest field rather than bending the default linear chain — the approved navigation is reproduced exactly, not changed. All screens live-verified: correct `data-smokecraft-screen-id`/`-component`/`-asset-key`/`-phase`/`-session` markers, forward/back navigation, no dropped internal side effects (journey/scorecard/badge/passport-claim state, server snapshots). The renderer still refuses to render an unregistered screenId rather than falling back silently — no fallback path exists for any of the 27.

## Files changed

New (Prompt 1, first migration): `smokecraftScreenManifest.js`, `smokecraftComponentRegistry.js`, `smokecraftInteractionManifest.js`, `smokecraftScreenDataSelector.js`, `smokecraftCompletionService.js`, `SmokeCraftScreenRenderer.jsx`, two test suites.

Modified (full migration completion): `App.jsx` (26 routes rewired to `SmokeCraftScreenRenderer`), 19 page components given optional `{ onBack, onComplete }` props (session-1,2,3,4,5,6,7,8,10,11,12,14,15,16,19,22,23,24,25,27 — AISummary was already done in the first migration), `smokecraftComponentRegistry.js` (all 26 remaining componentKeys registered), `smokecraftCompletionService.js` (merged-sibling same-route skip logic; `nextRouteOverride` support for Format), `smokecraftScreenManifest.js` (`nextRouteOverride` field, header comment updated to reflect true migration state).

## Tests

`verify-smokecraft-canonical-runtime.mjs` 19/19, `verify-smokecraft-zero-legacy-runtime.mjs` 9/9.

## Regressions

Clean-start (54/55, 1 live-only blocked as before), entry-prerequisite-guard (43/43), 27-session-sequence (39/39), tactile-haptic (71/71), approved-entry-visuals (24/24), canonical-journey-authority (25/25), Golden Box Packaging Studio (70/74), Passport Security (59/59) — all pass at established baselines, re-run after the full migration.

## Build / startup / health

All pass.

## Honest disclosure — a pre-existing, unrelated defect found during migration testing

Live-testing AI Summary's migration surfaced that `awardSessionRewards('ai-summary')` has always silently no-op'd — `smokecraftRewards.js`'s reward map has no entry for that id (the same stale-numbering file already documented as inert metadata by the 27-Session-Sequence pass). `completeSmokeCraftScreen` correctly reproduces this exact pre-existing behavior; this is not a regression this pass introduced, and not fixed here (out of scope) — disclosed for a future pass.

## Remaining blockers

No Railway access (unchanged) — live deployment verification remains outside this session's reach. All 27 curriculum screens are now migrated; no screen remains on a competing production-reachable navigation/completion path.

**Status: PASS — SMOKECRAFT CANONICAL RUNTIME SOURCE ARCHITECTURE COMPLETE**

All 27 curriculum sessions route through `SmokeCraftScreenRenderer`/`completeSmokeCraftScreen`/`getSmokeCraftScreenData`. The one genuine non-linear case (session-5/Format) is modeled correctly via a manifest override rather than excluded or forced into a shape that would have changed approved navigation. No parallel runtime, compatibility shortcut, or qualified/fake pass was used. Live deployment verification is separately, honestly unchecked (no Railway access in this session) — that gap is disclosed, not folded into this status.
