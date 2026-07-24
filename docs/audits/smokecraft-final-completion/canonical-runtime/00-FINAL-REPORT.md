# 00 — Final Report: Canonical Runtime and Sequence Reconstruction (Prompt 1 of 2)

**Repo/branch:** `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
**Starting commit:** `2c1abab3095b4afb904a801fcbbc090e9f7a9e95` — verified local=remote, clean tree, before this pass.

## Scope decision, made explicit with the user before writing code

This mandate requested replacing all 21+ independently-built, working, extensively-regression-tested SmokeCraft screen components with thin wrappers driven by one new generic `SmokeCraftScreenRenderer`. Given ~10 prior passes' independent traces of this codebase repeatedly found single-source-of-truth patterns already in place per concern (one session registry, one guard, one journey-status function, one entry-readiness function, one asset registry), a full 27-screen rewrite in one pass was flagged as high-risk before starting. The user selected **"scoped middle ground"**: build the new canonical layers as real, working, additive infrastructure, and migrate one representative screen to prove it — not the full 27-screen migration.

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

**Not migrated this pass.** Present in the manifest (real, correct entries), but their `App.jsx` routes still render their existing, unchanged components directly — the pre-existing architecture already confirmed correct by prior passes (Canonical Journey Authority, Tactile/Haptic Completion, 27-Session Sequence).

## Session 1–27 runtime result

1 of 27 (session-21, AI Summary) migrated through the canonical runtime and live-verified: correct manifest-driven next route reached, production markers (`data-smokecraft-screen-id`, etc.) present, prerequisite rejection works, and the renderer refuses to render an unregistered screenId rather than falling back silently. The remaining 26 sessions are unchanged, still on their existing direct-navigate architecture.

## Files changed

New: `smokecraftScreenManifest.js`, `smokecraftComponentRegistry.js`, `smokecraftInteractionManifest.js`, `smokecraftScreenDataSelector.js`, `smokecraftCompletionService.js`, `SmokeCraftScreenRenderer.jsx`, two test suites. Modified: `App.jsx` (1 route), `AISummary.jsx` (optional props, backward compatible).

## Tests

`verify-smokecraft-canonical-runtime.mjs` 19/19, `verify-smokecraft-zero-legacy-runtime.mjs` 9/9.

## Regressions

Clean-start (54/55), entry-prerequisite-guard (43/43), 27-session-sequence (39/39), tactile-haptic (71/71), approved-entry-visuals (24/24), canonical-journey-authority (25/25), Golden Box Packaging Studio (70/74), Passport Security (59/59) — all pass at established baselines.

## Build / startup / health

All pass.

## Honest disclosure — a pre-existing, unrelated defect found during migration testing

Live-testing AI Summary's migration surfaced that `awardSessionRewards('ai-summary')` has always silently no-op'd — `smokecraftRewards.js`'s reward map has no entry for that id (the same stale-numbering file already documented as inert metadata by the 27-Session-Sequence pass). `completeSmokeCraftScreen` correctly reproduces this exact pre-existing behavior; this is not a regression this pass introduced, and not fixed here (out of scope) — disclosed for a future pass.

## Remaining blockers

No Railway access (unchanged). 26 of 27 curriculum screens remain on the pre-existing architecture — not migrated, by explicit, user-approved scope decision.

**Status: FAIL — COMPETING PRODUCTION RUNTIME PATHS STILL EXIST**

Chosen deliberately, per the mandate's own binary status requirement: technically true (26 screens' own inline navigate/award logic is a second, duplicated code path relative to the one new canonical service, even though no *incorrect* behavior was found in it). This reflects the explicit, user-approved scoped-middle-ground decision, not an unexplained shortfall — real infrastructure was built and proven against one screen, not fabricated as a full migration.
