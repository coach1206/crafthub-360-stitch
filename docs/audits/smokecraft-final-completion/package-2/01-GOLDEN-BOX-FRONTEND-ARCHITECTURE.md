# Golden Box Frontend Architecture — Package 2

## Disclosed consolidation from the mandate's 10 named screens

The mandate lists 10 distinct screens. Package 2 delivers all 10
*conceptual* states as real, backend-connected UI, consolidated into
**4 route files** for maintainability, each internally implementing the
distinct screens/states the mandate describes:

1. `GoldenBoxHub.jsx` → screen 1 (Golden Box Hub / competition discovery)
2. `CompetitionDetail.jsx` → screens 2-3 (Competition Detail + Eligibility Result, since eligibility is a real sub-action of viewing a competition, not a separate navigable route)
3. `EntryWorkspace.jsx` → screens 4-9 (Entry Creation, Blend-Builder Foundation, Educational Detail Panel host, Draft Review, Submission Confirmation, Entry Status) as one route with internal step state (`blend | review | confirm`), each a real, distinct rendered view — not a single oversized form
4. `ResultsExperience.jsx` → screen 10 (Results Experience, links to the existing Leaderboard/Rewards screens rather than rebuilding them)

Plus the reusable **Educational Detail Panel** (`EducationalDetailPanel.jsx`,
one component for every educational interaction, per the mandate's
explicit "do not use a different custom modal for every item" rule) and
**Mentor Guidance Panel** (`MentorGuidancePanel.jsx`, dynamically reads
`journey.mentor`, never hardcoded).

## State separation (per the mandate's requirement)

- **Competition data / eligibility data**: `useGoldenBoxCompetitions()`,
  `useGoldenBoxCompetitionDetail()` in `src/hooks/useGoldenBox.js`.
- **Entry data**: `useGoldenBoxEntry()`, same file.
- **Educational content**: `educationalContentContract.js` — pure data
  shape + constructor functions, no component-local hardcoding.
- **Mentor data**: read from the existing `SmokeCraftJourneyContext`
  (`journey.mentor`), not duplicated into Golden Box state.
- **UI-only temporary state** (which educational panel is open, current
  workspace step, form field values before save): local `useState` in
  each component, never lifted into the shared hooks.

Business rules (eligibility logic, submission validation, scoring) live
entirely server-side (Package 1) — the frontend never re-implements
them, only renders the server's response.

## Reusable components (not "one oversized GoldenBox component")

`MediaSlot.jsx`, `EducationalDetailPanel.jsx`, `MentorGuidancePanel.jsx`,
`educationalContentContract.js` — all in
`src/components/smokecraft/goldenBox/`, imported by all 4 route files.
