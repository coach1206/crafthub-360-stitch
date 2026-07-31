# Implementation Package Plan

Grouped by shared architectural repair, smallest safe package first.
No package is implemented this pass.

## Package A — Tasting-Capture Server Authority (Sessions 8, 12, 16)

**Primary objective**: wire `FirstThird.jsx`/`SecondThird.jsx`/
`FinalThird.jsx` onto the app's own existing, already-built,
server-authoritative tasting-draft/completion architecture
(`saveTastingDraft`/`submitTastingCompletion`, already proven in
`MiniTasting.jsx`) instead of local-only `GuestSessionContext` state.
**Size**: small-medium — reuses existing backend, only 3 frontend
components + their local state-setters change. **Shared backend
contract**: all 3 sessions are the same interaction type
(tasting-rating-capture) and can share one wiring pattern.

## Package B — Multi-Category Rating Server Authority (Session 19)

**Primary objective**: wire `Scorecard.jsx`'s 6-category rating onto a
real server-evaluated/persisted submission (likely the same
tasting-draft architecture as Package A, or a dedicated scorecard
endpoint if the product decision requires a distinct contract — an
owner decision, see `13-defect-classification.md`). **Size**: small,
but should follow Package A so the shared contract is proven first.

## Package C — Selection/Classification Server Authority (Sessions 2, 5, 6, 10)

**Primary objective**: for the 4 VISUAL_ONLY sessions (Humidor Match
device-simulation selection, Format shape classification, Cut-Toast-
Light cut selection, Flavor Memory flavor-wheel selection), define and
implement a real, lightweight "was this selection educationally
appropriate" server check — this requires an **owner product decision**
per session on what makes a selection "correct" (e.g. is there a wrong
humidor setting, or is any selection pedagogically valid and the
requirement is only that a selection was made?). **Size**: medium — 4
sessions, likely a shared small validation-service pattern once the
per-session correctness rule is defined.

## Package D — Exploration-Engagement Verification (Sessions 3, 4, 15)

**Primary objective**: for the 3 PARTIAL "content-exploration"
sessions (Meet Your Cigar, Terroir, Knowledge Drop), decide whether
"opened all N sections" should become a server-verified completion
gate, or whether these are intentionally exploration-only with no
required assessment (an **owner product decision** — the mandate
explicitly warns against assuming every session requires a quiz).
**Size**: small once decided.

## Package E — Passport Stamp Sequencing Review (Session 23)

**Primary objective**: independently re-verify (not necessarily fix)
the pre-existing, documented claim-eligibility sequencing quirk
(claim UI requires Session 24's completion, which sequences after
Session 23 itself) — determine whether this is intended design or a
genuine defect. **Size**: small, investigation-first.

## Package F — Rewards Screen Data-Source Verification (Session 25)

**Primary objective**: confirm whether `Rewards.jsx` reads live
server player-state or locally-computed constants; if the latter,
wire it to the real server totals. **Size**: small.

## Recommended next package

**Package A — Tasting-Capture Server Authority (Sessions 8, 12, 16)**
— reuses fully existing, already-proven backend architecture (lowest
regression risk of any package), covers the largest single cluster of
same-type gaps (3 of the 12 non-complete sessions, all sharing one
interaction type and one available fix pattern), requires no owner
product decision (the "correct" answer for tasting capture is simply
"a real observation was recorded," matching what `MiniTasting.jsx`
already validates), and directly reduces the open-gap count from 12 to
9 in one small, focused, low-risk session.
