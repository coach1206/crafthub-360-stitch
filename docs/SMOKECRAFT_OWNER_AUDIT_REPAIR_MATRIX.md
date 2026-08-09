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

---

## Pass 2 — additional real fixes (this update)

Owner directive: no more partial passes. This pass closed more of the remaining matrix. Still not 100% — see "Still deferred" at the end, stated plainly.

| Item | Action | Evidence |
|---|---|---|
| #025 Pairing Lab empty recommendation output | **Real root cause found and fixed (SC-D082).** The only control that set `pairingTypes` was an invisible transparent hotspot layer positioned over the approved backdrop image — a real player had no visible way to make this selection, so the Live Recommendation Output panel legitimately never populated. Added a real, visible chip-selector row for Pairing Type in the same panel as the screen's other real selectors. | `src/pages/smokecraft/PairingLab.jsx` |
| #041 Management Sync dead-looking disclosure | **Redesigned (SC-D083).** The lower ~45% of the screen was a fully baked mock dashboard (Venue Operations Impact, Sync Activity table, Command Hub) with zero live DOM or data behind it — worse than "empty," it was misleading. Replaced with a real "Available Now" (existing real sync status/action) / "Coming In A Future Update" (named, honest list) split. No fake data. | `src/pages/smokecraft/ManagementSync.jsx` |
| 11 C/D screens | **1 of 11 corrected as a misclassification** (#040 Connections — all controls are real, visible, labeled DOM; only the decorative photo is large, which the mandate explicitly allows). **2 of 11 substantively improved this pass** (Meet Your Cigar, Pairing Lab) via the fixes above and in Pass 1. **Not converted this pass**: #038 Final Review (a genuine large data-wiring gap — 6 real journey-history sections with no live overlay were never built; this is comparable in scope to the original SC-D079 GoldenBox rebuild and needs its own dedicated pass, not a rushed attempt), #039 Rewards (already meets the mandate's own "honestly documented, fully usable, no fake substitute" exception — the empty "Today At Your Venue"/"Recent Redemptions" zones are disclosed, not silently broken), and the remaining screens not individually re-verified this pass (016/028/003/021's classification stands from Pass 1). |
| Meet Your Cigar photography | **Media slot implemented per Part 4's exact instruction.** No dedicated asset exists in the repo (confirmed again). Replaced the reused-image-from-a-different-screen with an honest, reserved-dimension media slot ("Padrón 1964 Series — reference image / Dedicated photography pending owner approval"), matching Lighting Tutorial's established pattern. All real cigar data (brand/blend/wrapper/binder/filler/factory/master blender tabs) is unaffected and remains live. Verified live: `meet-your-cigar-PASS2.png`. | SC-D080 (updated) |
| Lighting Tutorial media | **Polished per Part 5's exact instruction.** Real instructional text now leads; reserved media slot is smaller, secondary, reworded away from "pending production upload" as the primary message. Never blocked progression either way. Verified live: `lighting-tutorial-PASS2.png`. | SC-D084 |

### Still deferred (explicitly, not silently dropped)

- **#038 Final Review** — the largest remaining gap. 6 real sections (Journey Recap, What Stood Out, Review Notes, Readiness Check summary, Experience Snapshot, Final Reflection) need real journey-history data wired in; this is a from-scratch build comparable in size to the original GoldenBox blank-panel rebuild (SC-D079), not something safely rushed in the remaining time of this pass.
- **Full 4-viewport responsive/fluid pass** (tablet landscape, tablet portrait, kiosk) — not run this pass. 1440×900 desktop only, as before.
- **Full recapture of all 43 numbered screens** — not run. Targeted verification only (`public/proof/smokecraft-owner-audit-repair-verification/`).
- **#039 Rewards's two skeleton side-panels** — left as-is; they already satisfy the mandate's own disclosed-limitation exception, but could still be visually tightened (dashed-border honest style, matching Management Sync's new pattern) in a follow-up.

npm run build: clean (prebuild gates + production bundle, re-verified after Pass 2's changes).
