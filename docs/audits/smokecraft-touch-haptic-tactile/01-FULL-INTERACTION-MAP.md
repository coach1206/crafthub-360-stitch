# 01 — Full Interaction Map

This audit cross-references the existing canonical infrastructure (`src/utils/haptics.js`, `SmokeCraftTactileCard.jsx`, `EducationalDetailPanel.jsx`, `SmokeCraftImageBoundsOverlay.jsx`) against a real live-browser sweep, rather than hand-duplicating the screen-by-screen manifest that already exists in `src/constants/smokecraftScreenManifest.js`.

## Shared infrastructure (already built, verified still correct)

| Utility | Path | Role | Verified |
|---|---|---|---|
| Haptic helper | `src/utils/haptics.js` | Single canonical `triggerHaptic()`, used by all 51 SmokeCraft page files. Capability-guarded (`typeof navigator === 'undefined' \|\| !navigator.vibrate`), respects `prefers-reduced-motion` and the account `hapticsEnabled` preference. | Source-verified this pass; regex assertions in new suite. |
| Tactile card | `src/components/smokecraft/SmokeCraftTactileCard.jsx` | Pressed/selected/disabled/loading/keyboard/focus/haptic/72px-touch-target states, adoptable by any screen. | Unchanged, not touched this pass. |
| Educational detail panel | `src/components/smokecraft/goldenBox/EducationalDetailPanel.jsx` | Renders What/Why/Quality/Flavor/Aroma/Strength/Construction/Burn/Draw-performance/Decision/Compatibility/Mentor rows for any catalog-backed educational item. | **Fixed this pass** — see below. |
| Content contract | `src/components/smokecraft/goldenBox/educationalContentContract.js` | Normalizes catalog rows into the shape `EducationalDetailPanel` expects. | **Fixed this pass** — see below. |
| Image-bounds overlay | `src/components/smokecraft/SmokeCraftImageBoundsOverlay.jsx` | Non-destructive, percentage-based, aspect-ratio-preserving approved-image rendering with aligned interaction zones. Already the established pattern across the app. | Unchanged, not touched this pass. |

## The one genuine content gap found and fixed

`EducationalDetailPanel`/`educationalContentContract.js` already had a `performance_impact` column selected by `contentService`, but the mapping function silently dropped 3 real, already-authored DB columns (`aroma_impact`, `strength_impact`, `burn_impact`) before they ever reached the panel — and the `performance_impact` value itself was never seeded for the very rows (burn-troubleshooting, smoking-technique) that exist specifically to teach draw and burn (0/84 populated).

This is exactly the mandate's stricter bar: "every clickable educational visual must explain what/why/how it affects flavor/strength/construction/draw/burn/quality/how to apply" — the UI already asked the right question, the data pipeline silently discarded part of the real answer.

**Fix:**
- `educationalContentContract.js`: `fromCatalogRow()` now maps `aroma_impact`/`strength_impact`/`burn_impact` through to the panel (previously dropped).
- `EducationalDetailPanel.jsx`: renders "Aroma", "Strength & body", and "Burn behavior" rows (in addition to the existing Quality/Flavor/Construction/Performance rows).
- `server/db/migrations/091_educational_draw_burn_and_application_guidance.sql`: authors real, hedged, non-fabricated `performance_impact`/`decision_guidance` content for 52 of 84 catalog rows where the draw/burn/application relationship is genuinely well-established (burn-troubleshooting, construction-characteristics, leaf-priming, component-roles, bunching-methods, cigar-anatomy, smoking-technique, format, leaf-structure, processing). Deliberately does NOT blanket-fill all 84 — draw/burn is not honestly attributable to a seed pod, root, or country of origin, and inventing an effect there would be fabrication. Every `UPDATE` is `IS NULL`-guarded (idempotent, never overwrites authored content).

Verified live: a real "Learn More" click on Vitola (`/smokecraft/vitola`) opens the detail panel and renders the new content correctly; rows without an authored value for a given item correctly do not render (honest omission, not a blank placeholder).

## Everything else audited and confirmed already correct (no change made)

- **Touchscreen**: `hasTouch: true` Playwright context + `.tap()` on the Landing Start button confirmed real pointer/touch activation reaches the canonical resolver.
- **Keyboard/focus**: Tab from a cleared Landing lands on a real `<button>`/`<a>`, confirmed live.
- **Haptic gating**: capability guard and reduced-motion/preference respect both source-confirmed unchanged.
- **Refresh/persistence**: `completedSteps` byte-identical before/after a reload on a mid-journey screen.
- **6-phase/27-session structure**: unchanged, source-confirmed (`VISIT_STRUCTURE.length === 6`, `TOTAL_SESSIONS === 27`).
- **No permanently-highlighted Landing control**: `aria-current` on the Rewards hotspot confirmed not permanently `"page"`.
- **Rapid double-tap**: does not throw or corrupt session state on Humidor Match's Continue action.
- **Sliders/scorecard**: Scorecard (session-19) uses a tap-rating UI rather than `<input type="range">` — this is the same established, already-verified pattern from prior tactile-completion passes, not a gap.
- **Educational systems elsewhere** (Vitola, CigarGaugeGuide/Ring Gauge, WrapperStrength's FillerArrangement, Golden Box's 12 files, Packaging Studio): re-confirmed as substantial, real, working interactive systems from earlier passes — not rebuilt.

## Blocked (no new attempt, consistent with the mandate's own allowance)

The 3 already-disclosed `missing-approved-asset` screens (Welcome/S1, Rewards/S25, ResumeJourney) remain unchanged — no dedicated approved image exists for full-shell conversion, a pre-existing, honestly-disclosed condition from earlier passes, not a tactile-interaction defect.
