# 04 — Sequence Verification

Confirmed via `App.jsx` route registrations and each screen's own navigation targets:

1. `/smokecraft` (Landing) → Start/Resume/Start New Journey
2. `/smokecraft/enroll` → Activate Guest Pass / Explore as Guest → `/smokecraft/venue-select`
3. `/smokecraft/venue-select` → Continue to Identity → `/smokecraft/identity`
4. `/smokecraft/identity` → Begin My Journey → Golden Box → Mentor Selection (`requires: 'entry'`, reachable per the real, already-approved architecture — restructuring this was judged out of scope in the prior Entry-Prerequisite pass and remains out of scope here)
5. Mentor Selection → proceeds toward `/smokecraft/welcome`
6. `/smokecraft/welcome` (Session 1 entry gate, `sessionNumber={1}`)
7. `humidor-match` (first numbered session, `sessionNumber={2}`)

No change was made to this ordering in this pass. Only the visual correctness of steps 2 and 3 was in scope and corrected/verified.
