# SmokeCraft 360 — UI Developer Handoff Overview

**Start here: `SMOKECRAFT_UI_HANDOFF_BASELINE.md`** — states the exact verified commit, 0 known canonical blockers, and every test gate this baseline passed.

This package documents the complete, verified, canonical SmokeCraft 360 experience so a UI developer can improve its presentation without reverse-engineering the app or accidentally breaking gameplay logic.

**Source of truth for everything in this package**: `src/constants/session.js` (`VISIT_STRUCTURE`, `ENTRY_LAYER_SCREENS`, `SUPPORTING_MODULES`), `src/constants/smokecraftScreenManifest.js`, `src/constants/smokecraftComponentRegistry.js`. The JSON files in this folder (`ASSET_MAP.json`, `SCREEN_MANIFEST.json`, `ROUTE_TO_COMPONENT_MAP.json`) are generated directly from that code (`scripts/generateSmokecraftUiHandoffJson.mjs`) — regenerate them after any source change rather than hand-editing.

## What SmokeCraft 360 is

A guided, gamified cigar-education journey. A guest enters through a short entry layer (sign-in, venue selection, personal dashboard), then plays through 27 numbered "sessions" grouped into 6 phases — from choosing a cigar, through lighting and tasting it in three stages, to a final scorecard, Passport stamp, and a competitive "Golden Box" submission/judging flow.

## Read these files in this order

1. `CANONICAL_27_SESSION_SEQUENCE.md` — the spine, in order, with what happens at each session.
2. `FULL_SUBSTEP_SEQUENCE.md` — internal states within screens that aren't literally one-screen-one-step.
3. `SCREEN_BY_SCREEN_SPEC.md` — one record per screen: purpose, interaction, images, mentor behavior, previous/next.
4. `LIVE_INTERACTION_REQUIREMENTS.md` — what must remain real DOM (not baked artwork) on every screen.
5. `VISUAL_DESIGN_SYSTEM.md` — the locked navy/charcoal/champagne-gold identity and tokens already in use.
6. `IMAGE_AND_MEDIA_SPEC.md` — how images resolve (R2 → repo fallback → safe failure) and what's approved.
7. `RESPONSIVE_AND_TOUCH_SPEC.md` — supported viewports and touch-target rules.
8. `DO_NOT_BREAK_RULES.md` — the hard boundary between what's yours to change and what isn't.
9. `DESIGNER_ACCEPTANCE_CHECKLIST.md` — what to verify before calling a screen "done."
10. `CURRENT_VISUAL_DEFECTS.md` — known, disclosed presentation issues, not yet fixed.
11. `DESIGNER_FREEDOM_VS_ENGINEERING_LOCKS.md` — the same boundary as #8, structured for quick reference per element type.

## Numbers to keep in your head

- **27 canonical sessions, 6 phases.** Confirmed via `docs/SMOKECRAFT_FULL_GAME_INVENTORY.md` (generated from live code) — not 24, not 28.
- **5 entry-layer screens** before Session 1 (outside the 27 count): Launch, Sign In/Guest Mode, Venue Selection, Personal Dashboard, Resume.
- **3 supporting screens** are part of the real opening playthrough even though they sit outside the 27-count: Golden Box Rules → Mentor Selection → Seed & Soil, between Welcome (S1) and Choose Your Cigar (S2). See `CANONICAL_27_SESSION_SEQUENCE.md` for why.
