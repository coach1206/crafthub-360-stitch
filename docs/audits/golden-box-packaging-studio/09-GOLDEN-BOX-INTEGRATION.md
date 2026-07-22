# Golden Box Integration

## Route placement

Routes are nested under the existing `golden-box` route group in `App.jsx`, alongside the existing entry/judge/mentor routes — reachable from the same competition entry a learner is already building (`EntryWorkspace.jsx`'s blend/review/presentation/confirm flow), matching the expected relationship: **Build and Blend → Packaging Studio → Presentation and Defense → Submission**.

## What is and isn't connected this pass

- **Final submission is real and connected**: `submitFinalDesign()` requires a real, owned `golden_box_entries` row (`entryId`), validates the caller owns that entry, and writes to `packaging_final_submissions` with `UNIQUE(entry_id)` — one packaging submission per Golden Box entry, matching the entry-ownership pattern already proven for blend submissions.
- **No automatic navigation link was added inside `EntryWorkspace.jsx`'s own step flow this pass** — the mandate explicitly separates this pass ("Golden Box Packaging Studio Production Completion") from a future "Phase 9 Journey Amendment — Packaging Studio Integration" pass whose job is to wire the Packaging Studio into the visible Golden Box entry flow's navigation and status displays. Building that link here would be starting work explicitly deferred by the mandate ("Do not mark Packaging Studio as complete merely because a route exists... a separate journey-amendment verification must connect the Packaging Studio into the completed Phase 9 journey").
- **Judge/mentor visibility**: the same `visibilityService` policy already gating entry/results access now also gates the submitted packaging snapshot (`GET /entries/:entryId/final-submission`) — real and tested, but no dedicated judge/mentor Packaging Studio UI screen exists yet (see `00-FINAL-REPORT.md` disclosure).
- **27-session count unchanged**: the Packaging Studio is a Golden Box competition feature, not a core learning session — confirmed unchanged via the Phase 9 spine assertions (`TOTAL_SESSIONS = 27`, `TOTAL_VISITS = 6`), neither of which this pass touched.
- **No new judging score category was added** — packaging is not currently an approved judging criterion in `golden_box_scores`' fixed category list; the submitted snapshot exists as presentation evidence only, exactly as the mandate specifies for the "not currently scored" case.
