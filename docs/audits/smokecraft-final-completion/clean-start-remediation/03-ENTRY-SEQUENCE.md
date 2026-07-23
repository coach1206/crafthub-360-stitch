# 03 — Entry Sequence

## Real, existing route/guard graph (source-verified, not invented)

`ENTRY_LAYER_SCREENS` (`session.js`): Launch (`/smokecraft`) → Sign In/Guest Mode (`/smokecraft/enroll`) → Venue Selection (`/smokecraft/venue-select`) → Personal Dashboard (`/smokecraft/identity`) → Resume or Start New Journey (`/smokecraft/resume`).

`getEntryRoute()` (`SmokeCraft.jsx`) enforces this exact order for the landing page's Start action: not enrolled → `/smokecraft/enroll`; enrolled but no venue → `/smokecraft/venue-select`; both done → `/smokecraft/resume`. It never returns `/smokecraft/welcome` directly — confirmed by source inspection.

`SUPPORTING_MODULES` (`session.js`) registers Mentor Selection (`/smokecraft/mentor-selection`) with `requires: 'entry'` — i.e., mentor selection in the **current, real, already-approved architecture is reached after S1 (Welcome), not before it**. This differs from the mandate's requested generic sequence ("...venue selection → mentor selection → Welcome..."), but per this pass's own instruction ("Inspect the real route map and use the existing approved route names. Do not invent duplicate routes. Do not skip required entry steps."), the real, already-locked architecture is authoritative — reordering mentor-before-Welcome would require restructuring `SUPPORTING_MODULES`' `requires` graph, which is out of scope for this pass (a state-reset defect fix, not a route-architecture change) and was not done.

## Corrected clean-start sequence (using only real, existing routes)

1. `/smokecraft` (Launch)
2. `START SMOKECRAFT JOURNEY` selected
3. `/smokecraft/enroll` (if not yet enrolled — enrollment is account-level, preserved across journeys, so a returning guest skips straight past this)
4. `/smokecraft/venue-select` (if no venue yet — also preserved across journeys)
5. `/smokecraft/resume` — now shows the corrected no-active-journey state (this pass's prior fix) with `START SMOKECRAFT JOURNEY` as primary
6. Clicking that button now calls `useStartNewSmokeCraftJourney()` (this pass's fix) — resets all journey-content state — and navigates to `/smokecraft/welcome`
7. `/smokecraft/welcome` (S1, Welcome to Today's Experience) — now renders with all journey-specific state genuinely blank
8. `/smokecraft/mentor-selection` (reachable once S1/`entry` is complete, per the real existing guard)
9. Remaining canonical 27-session spine, unchanged

## Deep-link protection — finding, disclosed honestly

`/smokecraft/welcome` is guarded by `SmokeCraftSessionGuard sessionNumber={1}` (`App.jsx:343`). This guard enforces "session N requires session N-1 complete" — since S1 is the first session in the spine, it has no earlier session to require, so the guard trivially allows it. **A direct, fresh (no cookie, no localStorage) deep link to `/smokecraft/welcome` was tested in this pass and does render the real Welcome screen without first passing through Enrollment or Venue Selection** — those are enforced only by the separate `getEntryRoute()` chain used by the landing page's own Start button, not by any guard on the `/smokecraft/welcome` route itself.

**This is a pre-existing gap, not introduced by this pass, and out of this pass's scope** (a state-reset defect fix, not an entry-layer route-guard hardening pass). It is disclosed here rather than silently left unmentioned or falsely claimed as fixed. It does not reopen the specific reported defect (stale learner/mentor/cigar data) — even via this deep-link path, `WelcomeExperience.jsx` still reads from the same (now correctly reset-capable) state, so a guest who genuinely never enrolled/selected a venue sees the same honest "Guest: Guest / Venue: Not selected yet" neutral state confirmed in `06-REGRESSION-MATRIX.md`'s proof capture — it is a missing *step-skipping* prevention, not a missing *stale-data* prevention.
