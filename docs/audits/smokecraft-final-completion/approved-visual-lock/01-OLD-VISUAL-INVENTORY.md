# Old / Legacy / Duplicate Visual Inventory — findings & disposition

Fresh, evidence-based sweep of the post-migration codebase (starting commit
`69e419fa`) for any old, duplicate, fallback, prototype, static-only, or
Claude-created SmokeCraft visual still reachable in production. Every entry below
is backed by a real grep/import fact.

## FOUND & FIXED this pass

### 1. Stale pre-migration component imports in `src/App.jsx` (20 removed)
Before the canonical-runtime migration, `App.jsx` rendered each curriculum screen
directly (`<HumidorMatch/>`, `<AISummary/>`, …). After migration those routes
render `<SmokeCraftScreenRenderer screenId="session-N" />` and pull the component
from `smokecraftComponentRegistry.js` instead — but the old top-level `import`
statements were left behind. Grep confirmed each was import-only (no JSX usage,
no other reference) — exactly the "old component import left by a rewiring pass"
the mandate anticipated.

Removed (all verified `<Component>`-usage count = 0 in App.jsx before removal):
`WelcomeExperience, HumidorMatch, MeetYourCigar, Terroir, CutToastLight,
LightingTutorial, FirstThird, FlavorMemory, PairingLab, SecondThird,
MentorCommentary, KnowledgeDrop, FinalThird, Scorecard, AISummary,
PairingRecommendations, PassportStamp, FinalReview, Rewards, SessionComplete`.

Evidence: `grep -nE "<Component[ />]"` for each of the 21 canonical names in
App.jsx returned zero matches; occurrence counts were 1 (import line only) or
import+comment-only for Terroir/Scorecard/Rewards. `Format` was already not
imported by App.jsx. Post-removal: `npm run build` passes; the canonical routes
still resolve through the registry (browser proof shows every session route
rendering with correct markers).

### 2. Dead legacy duplicate `src/pages/smokecraft/Format.legacy.jsx` (deleted)
A legacy visual duplicate of the live `Format.jsx` screen. `grep -rn "Format.legacy"
src server` returned zero references anywhere — genuinely zero-consumer, never
routed, never imported. Deleted (`git rm`). This was disclosed-but-kept across
prior passes; with the canonical Format screen locked, the dead duplicate is
removed cleanly.

### 3. Stale scope-note comment in `SmokeCraftScreenRenderer.jsx` (corrected)
The renderer's header comment still claimed "only 'session-21' is actually routed
through this component this pass" — false after the full 27-screen migration.
Corrected to state all 27 curriculum screens + Welcome route through it (removing
a stale reference is explicitly in-scope; no logic changed).

## FOUND & CONFIRMED SAFE (no change needed)

### Supplemental / supporting legacy routes (Art, Origins, Curation, Leaves,
### Cultivation, Blend, FlavorDNA, Pairing, Available, Assistant, PairingMastery, Vitola)
These pre-date the migration and are **not** duplicates of any of the 27 canonical
screens — none is registered for a `session-N` screenId and none is rendered as a
second path to a canonical screen. They are separate supplemental/reference routes
adjudicated and kept across ~12 prior passes. `PairingMastery`/`Vitola`/`Origins`/
`FlavorDNA` reference images are the same approved reference art that
`SC_ASSETS.knowledgeDrop*` intentionally reuses (disclosed in `smokecraftAssets.js`
comments) — a documented reuse, not new drift. Left unchanged (out of visual-lock
scope; removing them would be an unrelated refactor).

### Deprecated legacy flow arrays (re-verified still zero-consumer)
- `SMOKECRAFT_FLOW` (`src/constants/session.js`): consumed only by
  `getNextSmokecraftRoute`/`getLastSmokecraftRoute` in the same file, which have
  **zero** consumers anywhere else in `src` — still dead post-migration.
- `JOURNEY_STEPS` / `smokecraftJourneyContract.js`: consumed only within the dead
  `src/modules/smokecraft/` tree.
- `SmokeCraftModule.jsx`: not imported by App.jsx or the renderer (only a doc
  comment + an unrelated `getSmokeCraftModuleStatus` fn name mention).

### Asset registry (`SC_ASSETS`) — no old/duplicate active key
Every session asset key the manifest maps (`ASSET_KEY_BY_SESSION`) resolves to a
real `SC_ASSETS` entry; every registered curriculum component resolves its image
via `SC_ASSETS.*` (no hardcoded `/assets/...png` path bypasses the registry).
Superseded raw uploads (e.g. the earlier "Golden Box challenge.png", the alternate
leaderboard image) remain on disk **unregistered** (not an active key) per prior
disclosed decisions — not production-reachable as a screen visual.

## NOT FOUND
- No canonical curriculum component is double-routed (each `session-N` has exactly
  one route).
- No renderer fallback/default-component path (renderer throws on unknown screenId).
- No direct route renders an old screen in place of a canonical one.
- No approved screen borrows another screen's image; Welcome's missing asset is
  disclosed honestly rather than fabricated or substituted.
