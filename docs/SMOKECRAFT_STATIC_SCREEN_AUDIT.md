# SmokeCraft 360 — Static Screen Audit

Generated as part of the Canonical Journey Recovery pass. Evidence source: `node scripts/detectSmokecraftStaticGameplay.mjs` (regex-based, reads real file contents — not a stub), cross-checked against `docs/SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md`'s code-verified per-screen status column and `src/constants/smokecraftRequiredInteractions.js`.

**Detector result at audit time: 85/85 `src/pages/smokecraft/*.jsx` files pass — zero `STATIC MOCKUP DEFECT` findings.** The detector fails a file when either (1) an `<img>`/background-image element itself carries the `onClick`/`onLoad` handler that completes the session (the picture *is* the interaction), or (2) the manifest declares a real required interaction for a route but the component contains zero real interactive elements. Both were true of the pre-fix `HumidorMatch.jsx` (SC-D076) — that is exactly the defect class this audit hunts for.

## Classification key

- **REAL LIVE UI** — plain live DOM, no supporting background photography, or the photography is fully decorative (never a surface controls are drawn on top of).
- **LIVE UI + SUPPORTING IMAGE** — approved photography used as backdrop, with all controls rendered as real, separately-hit-tested DOM elements on top (buttons/inputs with real handlers) — the established `SmokeCraftImageBoundsOverlay` "image-shell" pattern, or a decorative header banner (e.g. HumidorMatch.jsx's new `HumidorHeroImage`).
- **STATIC MOCKUP DEFECT** — an image contains baked controls, baked progress/state, or baked navigation, and/or visible state can disagree with real state. **None found in this audit.**
- **LEGACY/UNUSED** — not reachable from the recovered canonical journey (§ below), a QA/diagnostic harness, or a generic non-interactive placeholder for content not yet built. Not part of active gameplay; static presentation here is honest, not a defect.

## Entry layer (outside the 27-session count)

| Route | Component | Classification | Evidence |
|---|---|---|---|
| `/smokecraft` | `SmokeCraft.jsx` (Launch) | LIVE UI + SUPPORTING IMAGE | detector PASS |
| `/smokecraft/enroll` | `Enroll.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS, real form/hotspots |
| `/smokecraft/venue-select` | `VenueSelect.jsx` | REAL LIVE UI | detector PASS, real venue list/search |
| `/smokecraft/identity` | `Identity.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS, real `<input>`/`<select>` |
| `/smokecraft/resume` | `ResumeJourney.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS |

## Canonical opening chain (recovered this pass — see `SMOKECRAFT_CANONICAL_JOURNEY.md`)

| Route | Component | Classification | Evidence |
|---|---|---|---|
| `/smokecraft/golden-box` | `GoldenBox.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS, real acknowledgement checkbox + Continue |
| `/smokecraft/mentor-selection` | `Mentor.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS, real `aria-pressed` mentor cards |
| `/smokecraft/seed-soil` | `SeedSoil.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS, real selectable options |

## 27-session numbered spine

| S# | Route | Component | Classification | Evidence |
|---|---|---|---|---|
| 1 | `/smokecraft/welcome` | `WelcomeExperience.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 2 | `/smokecraft/humidor-match` | `HumidorMatch.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) — **rebuilt this session (SC-D076) from a STATIC MOCKUP DEFECT to real live DOM + decorative hero banner** |
| 3 | `/smokecraft/meet-your-cigar` | `MeetYourCigar.jsx` | REAL LIVE UI | detector PASS (manifest-checked) |
| 4 | `/smokecraft/terroir` | `Terroir.jsx` | REAL LIVE UI | detector PASS (manifest-checked) |
| 5 | `/smokecraft/format` | `Format.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 6 | `/smokecraft/cut-toast-light` | `CutToastLight.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 7 | `/smokecraft/lighting-tutorial` | `LightingTutorial.jsx` | REAL LIVE UI | detector PASS (manifest-checked) |
| 8–9 | `/smokecraft/first-third` | `FirstThird.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 10 | `/smokecraft/flavor-memory` | `FlavorMemory.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 11 | `/smokecraft/pairing-lab` | `PairingLab.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 12–13 | `/smokecraft/second-third` | `SecondThird.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 14 | `/smokecraft/mentor-commentary` | `MentorCommentary.jsx` | REAL LIVE UI | detector PASS (manifest-checked) |
| 15 | `/smokecraft/knowledge-drop` | `KnowledgeDrop.jsx` | REAL LIVE UI | detector PASS (manifest-checked) |
| 16–18 | `/smokecraft/final-third` | `FinalThird.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 19–20 | `/smokecraft/scorecard` | `Scorecard.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 21 | `/smokecraft/ai-summary` | `AISummary.jsx` | REAL LIVE UI | detector PASS (manifest-checked) |
| 22 | `/smokecraft/pairing-recommendations` | `PairingRecommendations.jsx` | REAL LIVE UI | detector PASS (manifest-checked) |
| 23 | `/smokecraft/passport-stamp` | `PassportStamp.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 24 | `/smokecraft/final-review` | `FinalReview.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 25–26 | `/smokecraft/rewards` | `Rewards.jsx` | LIVE UI + SUPPORTING IMAGE | detector PASS (manifest-checked) |
| 27 | `/smokecraft/session-complete` | `SessionComplete.jsx` | REAL LIVE UI | detector PASS (manifest-checked) |

## Supporting/conditional modules (outside the 27-session count)

| Route | Requires | Classification | Evidence |
|---|---|---|---|
| `/smokecraft/wrapper-strength` | `format` | LEGACY/UNUSED | Renders null — pure redirect stub, no visual to audit (`SC_ASSETS.wrapperStrength` intentionally absent) |
| `/smokecraft/request-purchase` | `humidor-match` | LIVE UI + SUPPORTING IMAGE | detector PASS |
| `/smokecraft/smokecraft-challenge` | `scorecard` | REAL LIVE UI | detector PASS |
| `/smokecraft/second-humidor-match` | `scorecard` | LEGACY/UNUSED | Not part of the recovered canonical chain (distinct from S2 Humidor Match); detector PASS but out of active-journey scope per `SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md` §Conflicts |
| `/smokecraft/mini-tasting` | `scorecard` | LEGACY/UNUSED | Same as above — supporting module, not in the recovered primary chain |
| `/smokecraft/connections` | `passport-stamp` | LEGACY/UNUSED (shadow persistence) | detector PASS structurally; flagged for private-localStorage-key persistence drift in the prior Master Audit — not re-litigated this pass, out of scope |
| `/smokecraft/management-sync` | `passport-stamp` | LIVE UI + SUPPORTING IMAGE | detector PASS |

## Everything else (unguarded, admin/QA, or not reachable from the recovered canonical journey)

The remaining ~55 files in `src/pages/smokecraft/*.jsx` (Origins, Leaves, LeafChallenge*, Cultivation, Blend, FlavorDNA, Pairing, PairingMastery, Vitola, Terroir-standalone duplicates, HowItWorks, EventChallenge, Leaderboard, GoldenBoxStatus, Assistant, Scan, GuestPass, Demo, admin/diagnostic/checkout/cart/order pages, etc.) all pass the detector (no image-drives-completion defect found in any of them) and are either: reachable only by direct URL outside the guarded spine, informational/`ComingSoon` placeholders for content not yet built, or staff/admin/QA-protected tooling. None of these gate or appear in the recovered canonical journey trace (§ next document), so none were in scope for repair this pass. **Zero `STATIC MOCKUP DEFECT` classifications among them** — the detector's defect #1 check (image-drives-completion) runs unconditionally against every file regardless of manifest entry, and returned clean for all 85.

## Summary

- **STATIC MOCKUP DEFECT found and repaired this pass:** 1 — `HumidorMatch.jsx` (SC-D076, fixed in the prior session; re-verified clean in this recovery pass).
- **STATIC MOCKUP DEFECT remaining:** 0.
- **Total files audited:** 85 (100% of `src/pages/smokecraft/*.jsx`).
- **Detector result:** 85/85 pass, 21/21 manifest-declared-interaction routes independently verified to contain real interactive elements.
