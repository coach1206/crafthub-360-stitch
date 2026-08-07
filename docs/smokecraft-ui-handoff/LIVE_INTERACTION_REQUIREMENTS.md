# Live Interaction Requirements

Every element listed below must remain a real, separately-hit-tested DOM element with a real event handler — never baked into a background image, never a screenshot pretending to be interactive.

- Every environment/mentor/wrapper/binder/component "card" — real `<button role="radio"|role="checkbox">` with `aria-pressed`/`aria-checked` reflecting real state.
- Every stepper (temperature, humidity) — real `+`/`-` buttons, minimum 44×44 CSS px touch target.
- Every toggle (seal, airflow) — real `role="switch"` control.
- Apply Settings / Continue / Back / Submit — real `<button>`, never a hotspot floating over baked button artwork text.
- Any "Active"/"Selected"/"Applied" badge — must be computed from the same state variable the completion/validation logic reads. This was the exact SC-D076 defect: a badge baked into artwork that always said "Active" regardless of real state.
- Quiz answers, scorecard categories, tasting-observation chips — real selectable elements; the server independently grades/validates, the client never self-declares "correct."
- Progress/session/phase labels ("Session 2 of 27 · Phase 1 of 6") — must be rendered from the real canonical data (`TOTAL_SESSIONS`/`TOTAL_VISITS`/session number), never baked text in an image. A baked "STEP 6 OF 17" was part of the SC-D076 defect and must never return.

## Enforcement

`scripts/detectSmokecraftStaticGameplay.mjs` — build-blocking, scans every page file for (1) an image element whose own `onClick`/`onLoad` completes the session, and (2) a route whose manifest declares a required interaction but whose component contains zero real interactive elements. A UI redesign must keep passing this at 85/85 (or higher as new files are added) — see `docs/SMOKECRAFT_STATIC_SCREEN_AUDIT.md` for the current, verified-clean baseline.
