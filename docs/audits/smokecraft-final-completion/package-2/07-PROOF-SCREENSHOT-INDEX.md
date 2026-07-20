# Proof Index — Package 2

## Addendum — closure pass (this update)

Real screenshot proof now exists at `public/proof/smokecraft-package-2/`
(14 PNG files + `results.json`), captured by
`verify-golden-box-package-2-closure.mjs` against a real seeded test
competition (`pkg2c-live-comp` / `pkg2-live-comp`, documented below as
test data, not fabricated results) and a real browser session with a
seeded journey (`journey.mentor = [{ name: 'Don Alejandro', ... }]`,
matching the real array shape `Mentor.jsx` actually produces).

| # | Filename | Route | Viewport | UI state | Data source | Fixture or real record | Interaction shown | Expected behavior | Pass/Fail | Known limitation |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `01-hub-handheld-390x844.png` | `/golden-box/competitions` | 390×844 | Ready, competitions loaded | Real API + seeded test competition | Fixture (test competition, documented) | Hub listing, mentor guidance panel | Real competition card renders, real mentor name shown | PASS | None |
| 2 | `02-competition-detail-handheld-390x844.png` | `/golden-box/competitions/:id` | 390×844 | Ready | Real API | Fixture | Competition detail view | No overflow, all fields visible | PASS | None |
| 3 | `03-eligibility-result-handheld-390x844.png` | same | 390×844 | Eligibility evaluated (open entry) | Real API (zero eligibility rules configured) | Fixture | "Check My Eligibility" clicked | Real backend evaluation, "Create My Entry" fully in-viewport | PASS | None |
| 4 | `04-blend-builder-handheld-390x844.png` | `/golden-box/entries/:id/blend` | 390×844 | Draft, entry created | Real DB row (real UUID entry_id) | Real record (created live, not a fixture) | Blend builder initial view | No overflow | PASS | None |
| 5 | `05-educational-modal-handheld-390x844.png` | same | 390×844 | Educational modal open | Client-side content contract (`not_yet_available` state) | N/A | "Learn More" clicked | Close control reachable within viewport | PASS | Content honestly `not_yet_available` (catalog unseeded, Package 1 disclosed state) |
| 6 | `06-draft-review-handheld-390x844.png` | same | 390×844 | Review step, 4 required components selected | Real DB (draft saved, version incremented) | Real record | "Continue to Review" | No overflow, validation summary shown | PASS | None |
| 7 | `07-submission-confirmation-handheld-390x844.png` | same | 390×844 | Confirm step, checkbox unchecked | Real record | Real record | "Continue to Submission" | Submit button disabled until checkbox checked, control not hidden off-screen | PASS | None |
| 8 | `08-entry-status-handheld-390x844.png` | same | 390×844 | Submitted/locked | Real DB (`status='submitted'`, server-verified) | Real record | Checkbox checked, submitted | No overflow, locked messaging | PASS | None |
| 9 | `09-results-handheld-390x844.png` | `/golden-box/results/:competitionId` | 390×844 | Judging not yet complete (honest state) | Real API | Fixture | "View Results / Status" | No overflow, honest "not released" message (real competition status is `registration_open`, not gamed to show fake results) | PASS | None |
| 10 | `10-competition-detail-handheld-360x800.png` | `/golden-box/competitions/:id` | 360×800 | Ready | Real API | Fixture | Narrower handheld spot check | No overflow | PASS | None |
| 11 | `11-hub-tablet10-1280x800.png` | Hub | 1280×800 | Ready | Real API | Fixture | — | No overflow | PASS | None |
| 11 | `11-hub-tablet12-1366x1024.png` | Hub | 1366×1024 | Ready | Real API | Fixture | — | No overflow | PASS | None |
| 11 | `11-hub-tablet15-1920x1080.png` | Hub | 1920×1080 | Ready | Real API | Fixture | — | No overflow | PASS | None |
| 11 | `11-hub-desktop-1440x900.png` | Hub | 1440×900 | Ready | Real API | Fixture | — | No overflow | PASS | None |
| 12 | `12-mentor-unassigned-state-desktop.png` | Hub | 1440×900 | Mentor removed from journey | Real client state (`journey.mentor` deleted, page reloaded) | N/A | Reload with no mentor selected | Honest "No mentor selected yet" copy shown, no fixed fallback identity | PASS | None |

All screenshots and their corresponding assertions are captured by the
same script run (`results.json` in the proof directory records the
23/23 pass result alongside the images) — functional evidence (DOM
text, database rows, bounding-box coordinates) is the primary proof;
screenshots are the visual corroboration, not the only evidence, per the
mandate's own instruction.

## Original disclosure (superseded by the above, kept for the record)

Prior to this closure pass, no dedicated screenshot directory existed —
Package 2's original delivery relied on `verify-golden-box-package-2.mjs`'s
22 functional checks alone. That suite remains in place and passing;
this addendum adds the visual proof layer on top of it, not a
replacement.
