# SmokeCraft 360 — Expected vs. Actual

For every area investigated this pass. "No defect" entries are included, not omitted, so this document is a complete record rather than a list of only the bad news.

| Area | Expected | Actual (before this pass) | Defect | Fix | Proof |
|---|---|---|---|---|---|
| 27-session spine existence | 27 real, componentized sessions | 27 real, componentized sessions | None | — | `docs/SMOKECRAFT_FULL_GAME_INVENTORY.md`, `scripts/verifySmokecraftFullGameInventoryLock.mjs` 60/60 |
| Opening sequence | Welcome → Golden Box Rules → Mentor Selection → Seed & Soil → Humidor Match | Welcome → Humidor Match directly (two independent causes) | SC-D077 | `WelcomeExperience.jsx` navigate target + `smokecraftScreenManifest.js` `nextRouteOverride` | `scripts/verifySmokecraftCanonicalJourneyLock.mjs` 14/14, real-click route trace |
| Humidor Match visible/validated state agreement | Visible "Active" state always equals real selection | Baked mockup always showed "Active" regardless of real state | SC-D076 | Rebuilt as real live DOM | `scripts/verifySmokecraftHumidorMatchRegression.mjs` 19/19 |
| Static/baked gameplay elsewhere in the 85 page files | None | None found | None | — | `scripts/detectSmokecraftStaticGameplay.mjs` 85/85 |
| Second Humidor Match / Mini Tasting Round / SmokeCraft Challenge | Expected to be either canonical or clearly retired | Real, reachable, but only from non-spine hub screens (EventChallenge/CraftHub), a legacy side-chain from the pre-27-session era | Classification gap (undocumented status), not a functional defect | Documented, classified LEGACY_UNUSED with full evidence chain | `docs/SMOKECRAFT_ORPHAN_ROUTE_AUDIT.md` |
| Session images | Every session's declared asset resolves and renders | Confirmed — 0 missing at existence layer, confirmed rendering at browser layer for every screen captured this pass | None | — | `docs/SMOKECRAFT_IMAGE_SURFACE_AUDIT.md` |
| Mentor coverage | Mentor should appear at selection, and again at a real in-game commentary moment | Both exist: Mentor Selection (opening chain) and Mentor Commentary (S14) | None found — coverage exists at both intended points | — | `docs/SMOKECRAFT_FULL_GAME_INVENTORY.md` (S14), `SCREEN_BY_SCREEN_SPEC.md` |
| XP / reward economy | No duplicate or missing XP across a full run | Confirmed — server-reported total XP exactly matches the sum of the server-owned reward table over all 22 completed session ids | None | — | `scripts/verify-smokecraft-full-game-fresh-player.mjs` §3, 62/62 |
| Passport stamp | Server-computed eligibility, real claim | Confirmed real and server-owned | None | — | same suite, §3 |
| Golden Box lifecycle | Real build→submit→judge→finalize→award | Confirmed real end-to-end, single-entrant correctly awarded first place (no fabricated placement) | None | — | same suite, §4 |
| Cross-player isolation | A second fresh guest never inherits the first guest's progress | Confirmed | None | — | same suite, §5 |
| Golden Box Rules tablet-portrait presentation | No severe letterboxing | ~45% of viewport is empty black bars | Real, disclosed | Not fixed this pass — shared-component risk, see `CURRENT_VISUAL_DEFECTS.md` | Screenshot in `public/proof/smokecraft-canonical-opening-sequence-recovery/` |
| Build-blocking coverage of the above | Canonical order / session count / static gameplay / asset presence all enforced at build time | Static-gameplay detector existed but was **not** wired into `prebuild`; no canonical-order or session-count lock existed at all | Enforcement gap | Wired detector + 2 new lock scripts into `npm run prebuild` | `package.json` prebuild chain, all passing |

**No unexplained difference remains at final completion** — every row above ends in either "None" or a documented fix with proof, except the one disclosed, deliberately-deferred visual defect.
