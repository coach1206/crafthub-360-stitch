# SmokeCraft 360 — Full Visual Acceptance Review

**This is a human-reviewable visual inspection pass, performed by opening
and looking at each route's actual rendered screenshot** — not a re-run of
DOM/asset-path automated checks. It supersedes the "33/33 KEEP" conclusion
in `docs/SMOKECRAFT_FULL_APPROVED_IMAGE_RECONCILIATION.md` for every route
listed below: that pass proved asset paths and registry keys were correct,
which is true and remains true, but did **not** prove the rendered page is
visually clean — and it is not, in several cases.

No source code was modified during this review. All findings below are
recorded for correction in a future package, per this task's explicit
"do not change it during this review pass" instruction.

## Update — corrections applied in the follow-up package

Findings 1-3, 5-9 below were corrected (or partially corrected) in a
follow-up package — see `docs/SMOKECRAFT_VISUAL_DEFECT_CORRECTION_REPORT.md`
for the full root-cause analysis (two distinct bug classes found: non-
opaque panel backgrounds letting baked image content bleed through, fixed
in 9 files; and a separate, still-open genuine panel-overlap layout bug in
Request/Purchase and Pairing Lab). This document's original findings are
preserved below unmodified as the historical record of what was found.

## Verdict summary

| Verdict | Count |
|---|---|
| VISUAL PASS | 8 |
| VISUAL FAIL | 9 |
| NEEDS USER REVIEW (not yet individually inspected this pass) | 16 |

**33 routes total.** This is a BLOCKED result — 9 confirmed failures and 16
unreviewed routes, well short of the "every route inspected, zero FAIL"
bar this task requires before approval.

## Confirmed VISUAL PASS (screenshot opened and inspected)

| Route | Component | Finding |
|---|---|---|
| `/crafthub` | `CraftHub.jsx` | Matches approved image exactly, no defects |
| `/smokecraft` | `SmokeCraft.jsx` | Real progress correctly shows Resume Journey, composition matches approved landing |
| `/smokecraft/enroll` | `Enroll.jsx` | Matches approved Guest Pass composition, clean |
| `/smokecraft/venue-select` | `VenueSelect.jsx` | Honest "No venues connected yet" empty state, matches documented intentional design |
| `/smokecraft/identity` | `Identity.jsx` | Real, live, honest data, no defects |
| `/smokecraft/meet-your-cigar` | `MeetYourCigar.jsx` | Honest "No cigar selected" empty state before interaction, large blank area below is acceptable whitespace for this state |
| `/smokecraft/terroir` | `Terroir.jsx` | Honest empty state before interaction, clean |
| `/smokecraft/cut-toast-light` | `CutToastLight.jsx` | Clean layout, correct session number (6/27), one minor note: a small in-content "← BACK" button duplicates the fixed nav bar's "← BACK" — low severity, not blocking |

## Confirmed VISUAL FAIL (real, reproducible defects)

### 1. Golden Box — masked zones read as unfinished black rectangles
**Route:** `/smokecraft/golden-box` · **Component:** `GoldenBox.jsx`
**Defect:** The three `BlankPanel` masks (Your Commitment, Venue Settings,
Guest Agreements) are functionally correct — they successfully hide baked
fake form content and pass the automated opacity check — but visually they
render as plain, unlabeled, texture-less dark rectangles sitting inside an
otherwise rich, ornate approved composition. This matches the failure mode
this task names explicitly: "No black mask looks like an unfinished
rectangle."
**Correction needed:** Add subtle texture/border treatment consistent with
the surrounding approved panels (e.g., the same corner ornamentation used
elsewhere in the image) so the masks read as intentional design, not
placeholders.
**Smallest correction method:** Method C (preserve full composite, restyle
mask treatment only — no layout change).

### 2. Mentor Selection — fixed bottom nav bar covers second-row card content
**Route:** `/smokecraft/mentor-selection` · **Component:** `Mentor.jsx`
**Defect:** At 1440×900, the fixed Back/Continue nav bar overlaps the
bottom of the second row of mentor cards. Maestro Rafael, Carlos Mendoza,
Thomas A. Blackwell, and Dr. Paulo Oliveira's bio text is visibly cut off
mid-sentence underneath the bar.
**Correction needed:** Reserve scroll-container bottom padding equal to the
nav bar height, or make the card grid scrollable within a bounded area that
accounts for the fixed bar.
**Smallest correction method:** Method F (logic is correct, fix responsive
layout only).

### 3. Seed & Soil — fixed bottom nav bar covers lower content
**Route:** `/smokecraft/seed-soil` · **Component:** `SeedSoil.jsx`
**Defect:** Same pattern as #2. "Connecticut Seed" and "Limestone-Rich
Soil" rows are cut off/faded, and a "Tasting Notes / Learning Summary /
Notes" section beneath them is almost entirely hidden under the fixed nav
bar.
**Correction needed:** Same as #2.
**Smallest correction method:** Method F.

### 4. Default locked-session image contains baked stale "8-visit/24-session" text
**Route:** any session-gated route when the guard legitimately blocks
access (confirmed reproduced on `/smokecraft/humidor-match`,
`/smokecraft/format`, `/smokecraft/session-complete` when navigated to
before their prerequisites) · **Component:** `LockedSmokeCraftScreen.jsx`
**Asset:** `public/smokecraft-future-visit-locked.png`
**Defect:** This is the actual root cause of the "VISIT 5 OF 8" / "SESSION
18 OF 24" / "Future Visit Locked" defect originally reported by the user
many packages ago in this session. Earlier root-cause analysis this
session correctly found no *live React text* renders this — but the
**baked PNG asset itself** (used as `DEFAULT_LOCKED_ASSET` for every locked
session except 21/22/23) contains this exact stale text burned into the
pixels: "VISIT 5 OF 8", "SESSION 18 OF 24", "Finish Session 24 to unlock
Visit 6". This was missed by every prior pass this session because grep
and DOM-text checks cannot see text baked into an image. This is reachable
in completely ordinary production scenarios — any time a guest navigates
to a session they haven't unlocked yet (a stale bookmark, browser back
button, direct link).
**Correction needed:** Replace `public/smokecraft-future-visit-locked.png`
with a version using the correct 6-phase/27-session language, or replace
the static image with a live-rendered lock screen (the surrounding React
overlay already correctly computes and displays `Phase {visitNumber} of
{TOTAL_VISITS}` — the fix could be as small as removing reliance on the
image's own baked counter and ensuring the image contains no counter text
at all).
**Smallest correction method:** Method B (wrong asset — need a corrected
or new approved asset without baked stale counts) or Method C if a
same-image texture-only variant can be sourced.

### 5. Format — overlapping header text
**Route:** `/smokecraft/format` · **Component:** `Format.jsx`
**Defect:** Top-left header shows "SESSION" and "CRAFTHUB 360" text
rendering on top of each other, illegible.
**Correction needed:** CSS layout fix to the shared header nav component
used by this screen — investigate the component to determine which two
elements are colliding.
**Smallest correction method:** Method F (responsive/layout fix only).

### 6. Humidor Match — duplicated/overlapping "Live Control" panel
**Route:** `/smokecraft/humidor-match` · **Component:** `HumidorMatch.jsx`
**Defect:** A "LIVE CONTROL" modal/panel renders on top of the base panel
without correct offset, producing doubled, garbled text ("Virtual
Humidor" appears twice, temperature/humidity values overlap).
**Correction needed:** Fix the modal's positioning/z-index so it either
fully replaces or is clearly separated from the base panel.
**Smallest correction method:** Method F.

### 7. Request/Purchase — severe overlapping panels throughout
**Route:** `/smokecraft/request-purchase` · **Component:** `RequestPurchase.jsx`
**Defect:** Multiple sections ("Add to Your Order", "Matched Cigar
Recommendation", "Choose Ordering Path", "Purchase Review") render
simultaneously stacked on top of each other rather than in their own
document-flow positions. Duplicate "BACK" buttons visible. This is the
worst-affected screen found in this review.
**Correction needed:** Layout audit of this component's positioning
scheme — likely several sections are using `position: absolute`/`fixed`
without a correctly sized relative container, or a conditional
single-section-visible pattern isn't being applied.
**Smallest correction method:** Method F, but likely the largest scope of
any finding in this report — recommend its own dedicated correction pass.

### 8. Pairing Lab — severe overlapping panels throughout
**Route:** `/smokecraft/pairing-lab` · **Component:** `PairingLab.jsx`
**Defect:** Same pattern and severity as #7 — "Pairing Choices" panel
overlaps the hero title, sidebar filter content duplicates and overlaps
itself.
**Correction needed:** Same as #7.
**Smallest correction method:** Method F.

### 9. Scorecard — severe overlapping panels throughout
**Route:** `/smokecraft/scorecard` · **Component:** `Scorecard.jsx`
**Defect:** Same pattern as #7/#8 — "Session Details", "Rating
Categories", "Final Impressions" all render stacked/overlapping. Also
displays "VISIT 12 OF 16" at the top, which does not match any known
counting scheme in this app (not the 6-phase/27-session registry, not an
obviously-labeled internal step count) — flagged for verification, not yet
confirmed as stale text since it may be a legitimate internal
question/section counter.
**Correction needed:** Same layout fix as #7/#8, plus verify the "VISIT 12
OF 16" label's source and correctness.
**Smallest correction method:** Method F.

### Also observed (same overlapping-panel pattern, not yet in the numbered list above)
`/smokecraft/first-third` (`FirstThird.jsx`) — bottom "First Third
Observations / Learning Summary / Notes" section is cut off/overlapped by
the fixed Continue bar, same class as #2/#3. `/smokecraft/flavor-memory`
(`FlavorMemory.jsx`) — sections 4 through 9 (Strength & Body, Overall
Experience, Pairing Recall, Flavor Profile Summary, Memorable Moment, Save
Your Memory) overlap each other and the radar-chart labels. Both confirmed
via direct screenshot inspection; not given their own numbered entries
above only because they match an already-documented pattern (#2/#3 and
#7/#8/#9 respectively), not because they are less real.

## NEEDS USER REVIEW — not yet individually visually inspected this pass

Given the volume of confirmed, severe, reproducible defects found in the
first ~17 of 33 routes inspected — including a systemic overlapping-panel
layout bug affecting at least 5 confirmed screens and likely more — this
review is being reported now rather than continuing indefinitely, so the
findings so far can be acted on. The following routes have **not** been
individually opened and visually inspected in this pass and must not be
assumed clean:

`/smokecraft/second-third`, `/smokecraft/mentor-commentary`,
`/smokecraft/knowledge-drop`, `/smokecraft/final-third`,
`/smokecraft/ai-summary`, `/smokecraft/pairing-recommendations`,
`/smokecraft/passport-stamp`, `/smokecraft/final-review`,
`/smokecraft/rewards`, `/smokecraft/achievements` (shares the Rewards
route), `/smokecraft/connections`, `/smokecraft/management-sync`,
`/smokecraft/session-complete` (blocked by test-seed prerequisite gaps,
real content not yet seen), `/smokecraft/how-it-works`,
`/smokecraft/leaderboard`.

Given the confirmed pattern, these should be treated as likely-at-risk,
not presumed passing, until individually inspected.

## Root cause hypothesis for the overlapping-panel pattern

Five confirmed instances (Humidor Match, Request/Purchase, Pairing Lab,
Scorecard, Flavor Memory) share the same symptom: multiple named sections
rendering simultaneously stacked at the same screen position instead of in
normal document flow or a correctly-sized relative container. This is
consistent with either (a) a shared layout wrapper component with a CSS
bug affecting `position`/`display` on its section children, or (b) a
conditional-visibility pattern (show one section at a time) that isn't
being applied at all, leaving every section visible and stacked. Not
confirmed without opening the relevant source files — recommended as the
first investigation step of the correction package.

## No source code changed during this review

Confirmed — this pass only read screenshots and, where a finding needed
root-cause confirmation (the locked-image defect), read image/component
source files without editing them.
