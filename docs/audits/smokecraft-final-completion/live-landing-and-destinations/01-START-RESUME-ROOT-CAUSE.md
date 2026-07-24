# 01 — Start / Resume Root Cause

**Verdict: the reported Start failure could NOT be reproduced in the production build.**

## Real-click evidence (fresh context, no seeding)
- Visible control matched by role/text: exactly 1 `BUTTON` "START SMOKECRAFT JOURNEY →".
- Bounding box ~ {x:43, y:406, w:275, h:46}; `document.elementFromPoint(center)` = the same BUTTON, `pointer-events: auto`, no overlay intercepting.
- Handler `handleStart()` fires → `navigate(entryRoute)` where `entryRoute = getEntryRoute()` = `/smokecraft/enroll` for a fresh visitor.
- URL after real click: `http://localhost:5050/smokecraft/enroll`.
- Journey pointer: `sc_journey_v1.activeJourneyId` present (auto-created on mount by SmokeCraftJourneyContext) — note it is nested, NOT a top-level `activeJourneyId` key.
- After reload: still on `/smokecraft/enroll` (persisted).
- Console: one benign 404 for a non-blocking resource; no pageerror, no navigation error.

## Resume
- With a real contiguous session prefix (`entry`,`humidor-match`,`meet-your-cigar` + entry-layer `enroll`) and venue selected, the landing CTA correctly renders "RESUME SMOKECRAFT JOURNEY →" (driven by the authoritative `computeJourneyStatus().hasStarted`).
- Real Resume click leaves `/smokecraft` and does NOT create a new journey (activeJourneyId unchanged before/after).

## Why prior "live" tests missed nothing here
The Start/Resume flow works. The prior suites' weakness was that `verify-smokecraft-clean-start-entry-flow.mjs` asserts on SOURCE STRINGS, never opening a browser — so it could neither confirm nor deny live behavior. This pass's new suite closes that gap with real clicks.
