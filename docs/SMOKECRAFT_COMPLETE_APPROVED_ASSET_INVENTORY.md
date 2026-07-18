# SmokeCraft 360 — Complete Approved Asset Inventory

Method: every filename under `public/assets/smokecraft-reference/approved/`, `public/assets/smokecraft/` (raw), and `public/assets/smokecraft/cropped/` was enumerated and cross-referenced (via URL-decoded set-diff) against every path string in `src/constants/smokecraftAssets.js` — the single active registry every SmokeCraft route reads from. This identifies, with certainty, exactly which files are **currently wired to a route** vs. **present on disk but unreferenced**.

**Depth disclosure:** the ~50 currently-wired assets are treated as confirmed/approved (they are the same images already visually verified route-by-route in `SMOKECRAFT_STATIC_SHELL_AUDIT.md`, and two of them — landing + guest-pass — were pixel-inspected in full this session). The ~100 unreferenced files were **not** individually opened at full resolution in this pass — that would mean visually inspecting ~100 multi-megabyte PNGs, which is out of proportion for a planning-phase audit. They are listed below by filename/location/naming-pattern confidence so a human or a future targeted pass can make routing decisions. No claim is made that an unreferenced file is worthless — only that it is not currently used, and its exact intended route is not yet confirmed by direct visual inspection.

## 1. Approved full-screen designs — currently wired (high confidence, in active use)

| Registry key | File | Route | Confirmed by |
|---|---|---|---|
| `landing` | `smokecraft-reference/approved/smokecraft-landing.png` | `/smokecraft` | Pixel-inspected this session |
| `enroll` | `smokecraft-reference/approved/smokecraft-guest-pass.png` | `/smokecraft/enroll` | Pixel-inspected this session |
| `identity` | `smokecraft/IDENTY.png` | `/smokecraft/identity` | Pixel-inspected, cropped this session (prior package) |
| `goldenBox` | `smokecraft/GOLDEN BOX RULES.png` | `/smokecraft/golden-box` | Registry reference only |
| `mentorSelection` | `smokecraft/MENTOR SELECTION1.png` | `/smokecraft/mentor-selection` | Registry reference only |
| `meetYourCigar` | `smokecraft/DISOVER YOUR CIGAR PROFILE.png` | `/smokecraft/meet-your-cigar` | Registry reference only |
| `mentorCommentary` | `smokecraft/MENTOR :COMMENTARY.png` | `/smokecraft/mentor-commentary` | Registry reference only |
| `format` | `smokecraft-reference/approved/smokecraft-vitola.png` | `/smokecraft/format` | Registry reference only |
| `seedSoil` | `smokecraft/SEED & SOIL.png` | `/smokecraft/seed-soil` | Registry reference only |
| `pairingLab` | `smokecraft/PAIRING LAB1.png` | `/smokecraft/pairing-lab` | Registry reference only |
| `humidorMatch` | `smokecraft/Humidor Match 1.png` | `/smokecraft/humidor-match` | Registry reference only |
| `requestPurchase` | `smokecraft/REQUEST PURCHASE.png` | `/smokecraft/request-purchase` | Registry reference only |
| `cutToastLight` | `smokecraft/CUT  TOAST, & LIGHT.png` | `/smokecraft/cut-toast-light` | Registry reference only |
| `firstThird` | `smokecraft/FIRST  THIRD1.png` | `/smokecraft/first-third` | Registry reference only |
| `secondThird` | `smokecraft/SECOND THIRD.png` | `/smokecraft/second-third` | Registry reference only |
| `flavorMemory` | `smokecraft/FLAVOR MEMORY.png` | `/smokecraft/flavor-memory` | Registry reference only |
| `finalThird` | `smokecraft/FINAL THIRD.png` | `/smokecraft/final-third` | Registry reference only |
| `scorecard` | `smokecraft/Scorecard.png` | `/smokecraft/scorecard` | Registry reference only |
| `smokecraftChallenge` | `smokecraft/SMOKECRAFT CHALLENG.png` | `/smokecraft/smokecraft-challenge` | Registry reference only |
| `secondHumidorMatch` | `smokecraft-reference/approved/smokecraft-second-humidor-match.png` | `/smokecraft/second-humidor-match` | Registry reference only |
| `miniTasting` | `smokecraft/Mini Tasting 11.png` | `/smokecraft/mini-tasting` | Registry reference only |
| `finalReview` | `smokecraft/FINAL REVIEW.png` | `/smokecraft/final-review` | Registry reference only |
| `passportStamp` | `smokecraft/PASSPORT STAMP.png` | `/smokecraft/passport-stamp` | Registry reference only |
| `managementSync` | `smokecraft/MANAGEMENT SYNC.png` | `/smokecraft/management-sync` | Registry reference only |
| `sessionComplete` / `recommendedNextJourney` | `smokecraft/SESSION COMPLETE.png` / `Recommend next journey.png` | `/smokecraft/session-complete` | Registry reference only |
| `leaderboard` | `smokecraft/LEADERBOARD 111.png` | `/smokecraft/leaderboard` | Registry reference only |
| `eventChallenge` | `smokecraft/EVENT CHALLENGE 111.png` | `/smokecraft/event-challenge` | Registry reference only |
| `howItWorks` | `smokecraft-reference/approved/smokecraft-how-it-works.png` | `/smokecraft/how-it-works` | Registry reference only |
| `rewards` / `achievements` | `smokecraft/REWARDS 222.png` / `ACHIEVMENTS.png` | `/smokecraft/rewards` | Registry reference only |
| `aiSummary` | `smokecraft/AI SUMMARY.png` | `/smokecraft/ai-summary` | Registry reference only |
| `pairingRecommendations` | `smokecraft/personlized pairing 222.png` | `/smokecraft/pairing-recommendations` | Registry reference only |
| `venueSelect` | `smokecraft/Venue Selection 11.png` | *(registered but unused — Venue Selection deliberately ships a strict empty state, no fabricated venues; asset key kept for a future real venue directory)* | Registry reference only |
| `lightingTutorial` | `smokecraft/LIGHTING TUTORIAL 1.png` | `/smokecraft/lighting-tutorial` | Registry reference only |
| `knowledgeDrop` | `smokecraft/KNOWLEDGE DROP.png` | `/smokecraft/knowledge-drop` | Registry reference only |
| `badgeLibrary` | `smokecraft/smokecraft badges.png` | *(registered, no direct route yet)* | Registry reference only |
| `terroir` / `terroirSoil` | `smokecraft-reference/approved/smokecraft-terroir.png` / `smokecraft-seed-soil.png` | `/smokecraft/terroir` | Registry reference only |
| `knowledgeDropTobacco/Fermentation/Aging/Factory` | reused Origins/Vitola/PairingMastery/FlavorDNA reference images | Knowledge Drop sub-topics | Deliberate reuse per locked plan (documented in registry comments) |
| `connections` | `smokecraft/cropped/connections-hero.jpg` | `/smokecraft/connections` | Registry reference only |
| `resume` | `smokecraft/cropped/golden-box-hero-v2.jpg` | `/smokecraft/resume` (decorative header only) | Pixel-inspected this session |

## 2. Approved decorative assets — currently wired

`enroll`'s prior key `discover-profile-bg.jpg` is now superseded by the Guest Pass full composition (still present on disk, unreferenced — see §7). `resume`'s `golden-box-hero-v2.jpg` (clean macro cigar-box photography, no baked text, confirmed this session).

## 3–6. Approved portraits / mentor / cigar / passport-reward imagery

Not separately broken out — these live inside the full-screen composites already listed in §1 (e.g. mentor portraits are baked into `MENTOR SELECTION1.png`; passport artwork is baked into `IDENTY.png`, `PASSPORT STAMP.png`, `smokecraft-guest-pass.png`). No standalone portrait/mentor/cigar asset files were found registered independently of a full-screen composite.

## 7. Duplicate variants (found via disk listing, unreferenced)

These filenames strongly suggest duplicate/alternate versions of currently-wired assets. Not opened at full resolution — flagged for a targeted visual pass before any reassignment:

| Unreferenced file | Likely duplicate of |
|---|---|
| `smokecraft/CUT, TOAST,& LIGHT22.png` | `cutToastLight` (`CUT  TOAST, & LIGHT.png`) |
| `smokecraft/CHOOSE YOUR CUT.png`, `choose your cut 11.png` | `cutToastLight` variants |
| `smokecraft/humidor match 111.png` | `humidorMatch` (`Humidor Match 1.png`) |
| `smokecraft-reference/approved/humidor match11.png` | `humidorMatch` variant |
| `smokecraft/KNOWLEDGE CHECK 11.png` | `knowledgeCheck` (registered separately as `KNOWLEDGE CHECK.png`) |
| `smokecraft/smokecraft comple 1.png` | `sessionComplete` (`SESSION COMPLETE.png`) |
| `smokecraft/passport-3.png`, `passport-4.png`, `passport-certified.png`, `passport-certified-final.png`, `passport-connection-1.png`, `passport-event.png` | Passport-family artwork, possible alternates for Connections/Passport screens — none currently wired |
| `smokecraft/final-third-tasting.png`, `findal third tasting.png` (typo in filename), `smokecraft/source/final-third-tasting.png`, `findal-third-tasting.png` | `finalThird` variants |
| `smokecraft-reference/approved/Golden box rules.11.png` | `goldenBox` variant |
| `smokecraft-reference/approved/Crafthub 360 landing page.png`, `smokecraft/crafthub-landing.png` | CraftHub entry (not a SmokeCraft route) |
| `smokecraft-reference/approved/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` (present in both raw and approved) | POS/venue-table feature, not SmokeCraft educational journey |

## 8. Obsolete designs

`smokecraft/novee-os-boot.png`, `smokecraft/dashboard expernice.png` (typo in filename), `smokecraft/profound-1.png` — no naming correlation to any current SmokeCraft route found. Likely early-iteration or unrelated-system artwork. Recommend "obsolete, do not use" pending confirmation.

## 9. Unapproved mockups

None identified as clearly mockup-only vs. production-approved by filename alone — this repository does not separate a "mockup" directory from "approved." Every file under `smokecraft-reference/approved/` is nominally approved by directory convention; files under the bare `smokecraft/` raw-upload directory are of equal likely provenance (same upload batches, per the registry's own comments about "2026-07-11 — newest, highest priority" raw uploads superseding cropped versions).

## 10. Unknown assets requiring a decision

| File | Notes |
|---|---|
| `smokecraft-reference/approved/ACCESS RESTRICTED.png` | Purpose unclear — possibly an auth/error-state screen not yet wired to any route |
| `smokecraft-reference/approved/INTERFACE NO.png` | Filename uninformative — needs visual inspection |
| `smokecraft-reference/approved/cigar , drink & pairingfood 0rdering.png` | Possibly a POS/commerce ordering screen, not educational journey |
| `smokecraft-reference/approved/cigar gauge guide.png` | Matches `CigarGaugeGuide.jsx` (orphaned-status route, S5 area) — likely its intended asset, currently unwired |
| `smokecraft/EAT SYSTEM.png`, `eat-system.png` | E.A.T. system feature, separate subsystem |
| `smokecraft/POS 3 SYSTEM.png`, `pos 3.png` | POS3 feature, separate subsystem |
| `smokecraft/SEED & PARING.png` (typo, "PARING" not "PAIRING") | Possibly an alternate/discarded Seed & Soil + Pairing combo screen |
| `smokecraft/Screenshot 2026-07-11 at 3.12.59 PM.png` | Raw screenshot, no route correlation — needs inspection or deletion candidate |
| `smokecraft/360 PASSPORT  2.png` | Passport artwork, possible Identity/Connections alternate |
| `smokecraft/request or purchange cigar.png` (typo), `request-purchase.png` | Possible `requestPurchase` alternates |
| `smokecraft-reference/approved/smokecraft-entry-gate.png` (= `smokecraft/smokecraft Intake.png`, same 941×1672 duplicate) | Full multi-section intake **form** design (Private Identity / Lounge Persona / Smoke Preference DNA) — richer than current `Identity.jsx`. Candidate for a future Identity redesign, not assigned this pass. |
| `smokecraft-reference/approved/smokecraft-profile-capture.png` | Alternate, larger Launch composition (1672×941) with more destination cards than the currently-wired `smokecraft-landing.png` — **do not swap in** without explicit approval; flagged only. |

**No files were deleted, renamed, or reassigned during this audit.**
