# SmokeCraft 360 — Owner-Audit Repair Matrix

Source of truth: `docs/SMOKECRAFT_OWNER_COMPLETE_VISUAL_INSPECTION.md` (43 screens/states, baseline commit `65958c2e`).

**Status of this pass: partial repair, with two corrected misdiagnoses. This is an honest progress record, not a claim that all 43 screens were converted to fully-live, fully-responsive, defect-free state — that remains substantial, undone work (see §"Deferred" below).**

## Canonical-status investigation (repository/Git evidence)

All 7 newly-discovered screens are **CANONICAL SUPPORTING SCREEN** — none are legacy/unused/superseded. Evidence: every one is actively routed in `src/App.jsx` behind a real `SmokeCraftSessionGuard`, listed in `docs/SMOKECRAFT_FULL_ROUTE_GRAPH.json`'s `supportingModules` array, and documented as intentional in `docs/smokecraft-ui-handoff/FULL_SUBSTEP_SEQUENCE.md`. No commented-out code, no dead imports, no orphaned routes.

| Screen | Route | Guard | Verdict |
|---|---|---|---|
| Wrapper/Strength Education | /smokecraft/wrapper-strength | requires: format | CANONICAL SUPPORTING SCREEN |
| SmokeCraft Challenge | /smokecraft/smokecraft-challenge | requires: scorecard | CANONICAL SUPPORTING SCREEN |
| Second Humidor Match | /smokecraft/second-humidor-match | requires: scorecard | CANONICAL SUPPORTING SCREEN |
| Mini Tasting Round | /smokecraft/mini-tasting | requires: scorecard | CANONICAL SUPPORTING SCREEN |
| 360 Passport Connections | /smokecraft/connections | requires: passport-stamp | CANONICAL SUPPORTING SCREEN |
| Venue/Management Sync | /smokecraft/management-sync | requires: passport-stamp | CANONICAL SUPPORTING SCREEN |
| Golden Box Competitions Hub | /smokecraft/golden-box/competitions | server-enforced (no route guard, by design — matches ManagementSyncAnalytics pattern) | CANONICAL SUPPORTING SCREEN |

## Corrected misdiagnoses (repository/Git evidence overturned the prior audit's flags)

Two of the audit's "defects" turned out, on code investigation, to be the capture tooling's own mistakes — not app bugs. Documenting this rather than silently "fixing" something that wasn't broken:

- **#005 Resume — OUT_OF_SEQUENCE flag was a false positive.** `ResumeJourney.jsx` deliberately redirects to `/smokecraft` when `hasProgress` is false (a guest with zero completed sessions) — see the file's own "Emergency Root-Cause pass" comment. The prior audit visited `/smokecraft/resume` before completing any session, so the redirect is **correct, intended behavior**, not a defect. **No code change made.**
- **#018 Wrapper/Strength Education — OUT_OF_SEQUENCE flag was a false positive.** `SmokeCraftSessionGuard requires="format"` checks `session.completedSteps.includes('format')` — real completion, not "screen visited." The prior audit's capture script navigated to Format and then immediately to Wrapper/Strength *without clicking Continue on Format first*, so the guard correctly redirected back. This is the capture script's sequencing bug, not an app defect. **No code change made.**

## Empty panels (7 flagged)

| # | Screen | Root cause (evidence) | Action taken |
|---|---|---|---|
| 003 | Identity | **Not a bug.** `Identity.jsx`'s own header comment: the right column is "DELIBERATELY BLANK BY DESIGN" — an entry-layer identity form must show no prior journey history/stale XP/rank. Confirmed intentional, previously-reasoned engineering decision. | No change — filling it would violate the screen's own documented purpose (would reintroduce stale-data leakage this screen was rebuilt to prevent). |
| 016 | Terroir | Real bug: `sectionId` state defaulted to `null`, so the entire content area was empty until a player clicked a tab. | **Fixed** — defaults to the first section (`SECTIONS[0].id`) so real content shows immediately (`src/pages/smokecraft/Terroir.jsx`). |
| 025 | Pairing Lab (recommendation result) | Live Recommendation Output panel stayed empty after a real pairing-type click in this pass. Root cause not yet isolated within this pass's time budget. | **Not fixed — deferred.** Needs its own investigation (likely a missing state-update wiring between pairing-type selection and the output panel's render condition). |
| 028 | Knowledge Drop | Same class of bug as #016: `topicId` defaulted to `null`. | **Fixed** — defaults to the first topic (`TOPICS[0].id`) (`src/pages/smokecraft/KnowledgeDrop.jsx`). |
| 038 | Final Review | Not investigated this pass (time-boxed). | **Not fixed — deferred.** |
| 039 | Rewards | Not investigated this pass (time-boxed). | **Not fixed — deferred.** |
| 041 | Management Sync | **Not a bug in the "fabricate data" sense.** `ManagementSync.jsx` explicitly, honestly states "Venue-wide aggregate insights are not connected yet — this venue analytics backend has not been built." The empty fields are a disclosed placeholder for a real backend feature that does not exist yet, not a wiring bug. | **Not fixed.** Building the real venue analytics backend is out of scope for a UI-repair pass ("keep it lean," no full backend regression) and would require fabricating data to fake-fill it, which the owner explicitly forbade. **NEEDS_OWNER_DECISION**: commission the real venue analytics backend, or accept the honest "not yet built" disclosure as correct behavior. |

**Empty panels repaired this pass: 2 of 7 (016, 028). 1 of 7 reclassified as not-a-defect (003). 1 of 7 is an honest disclosed limitation, not fixable without new backend work (041). 3 of 7 remain uninvestigated (025, 038, 039).**

## Missing image (021 — Lighting Tutorial)

**Not a bug — already compliant with governance rules.** The code's own comment: "Educational image/video area — honest placeholder, no fabricated imagery." No real demonstration-video asset exists anywhere in the repository for any Lighting Tutorial step. Per the owner's own instruction ("If an approved required asset genuinely does not exist: report the exact missing asset to the owner. DO NOT GENERATE A SUBSTITUTE"), the current behavior is correct. **No code change made.**

**NEEDS_OWNER_DECISION**: commission or approve real step-by-step demonstration photography/video for Cut the Cap / Toast the Foot / Light Evenly.

## Wrong images (014, 015 — Meet Your Cigar)

**Root cause found and fixed.** `src/constants/smokecraftAssets.js`'s `meetYourCigar` key was mapped to `DISOVER%20YOUR%20CIGAR%20PROFILE.png` — which is literally the Launch/CraftHub dashboard screenshot, not Meet Your Cigar content. Git history shows this was introduced by a prior commit that mislabeled the swap as a "dedicated approved asset" fix; it was not — no dedicated Meet Your Cigar photography exists anywhere in `public/assets/smokecraft/` (checked, including the `cigars/` subfolder).

**Fixed**: reverted to the last known-honest state — reusing Humidor Match's approved photography (openly disclosed via code comment, not invented) — until real dedicated photography exists. Verified live post-fix: `public/proof/smokecraft-owner-audit-repair-verification/meet-your-cigar-AFTER-FIX.png` confirms the Launch-screen image no longer renders on this screen.

**NEEDS_OWNER_DECISION**: commission or approve dedicated Meet Your Cigar photography (Padrón 1964 Series-appropriate imagery).

## Sequence defects (005, 018)

Both were false positives from the capture tooling, not real defects — see "Corrected misdiagnoses" above. **No route/order/unlock/navigation code changes were needed or made.**

## C/D static-UI conversion (11 flagged: 1 STATIC_SHELL, 10 MIXED/D)

**Not completed this pass — deferred, disclosed rather than claimed done.** Converting every meaningful piece of baked-image UI to real DOM across 11 screens (verifying which pixels are decorative-photography-only vs. functional UI-in-an-image, screen by screen) is a substantial, multi-session engineering effort in its own right — the same scale of work as the SC-D076/SC-D079 fixes from earlier in this project's history, each of which was its own dedicated pass. Attempting to rush all 11 in the remainder of this pass risked exactly the shortcut the owner explicitly forbade ("do not choose the shortest path," "do not remove content because it's inconvenient"). Two are addressed indirectly by this pass's fixes (014/015/016/028 no longer show wrong/empty content, improving their D-classification), but a full C/D→A conversion audit is **not done**.

## Responsive/fluid architecture (4 viewports)

**Not tested or changed this pass.** The complete-inspection audit's tablet-portrait gap (previously disclosed) remains open. No responsive CSS/layout architecture changes were made to any of the 43 screens in this pass.

## Deferred (explicitly not done this pass — for the owner's visibility)

- Full C/D → live-DOM conversion for all 11 flagged screens (only partial, incidental improvement via the wrong-image/empty-tab fixes)
- 4-viewport responsive/fluid pass (1440×900 desktop confirmed only; tablet landscape, tablet portrait, kiosk not tested)
- Root-cause investigation for empty panels #025, #038, #039
- A full recapture of all 43 numbered screens under the new fixes (a targeted, careful spot-verification was done instead — see `public/proof/smokecraft-owner-audit-repair-verification/`)
- Asset governance sign-off for the two genuinely-missing approved assets (Lighting Tutorial demo media, dedicated Meet Your Cigar photography) — these are `NEEDS_OWNER_DECISION`, not resolved
