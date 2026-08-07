# Full Substep Sequence — Internal Screen States

Most of the 27 sessions are genuinely one screen = one session. The exceptions — screens with real internal substeps/state machines a UI developer must preserve — are listed below. This list was built by reading each component's own state (`useState`/`phase` variables), not assumed from the screen's title.

## Humidor Match (S2)
Internal state, not separate routes: environment radiogroup selection → temperature/humidity/seal/airflow adjustment (only enabled once an environment is chosen) → Apply Settings (confirms values, never clears selection) → Continue (validates a real selection exists, submits to server, advances). A `loading`/`error`/`ready` phase gates the whole screen on mount (draft fetch).

## Format / Construction Inspection (S5)
Shape/size selection → burn-time estimate → forwards to Request/Purchase (a real branch outside the linear S5→S6 order, carried via `nextRouteOverride` — not a bug).

## First Third / Second Third / Final Third (S8-9, S12-13, S16-18)
Each is a tasting-observation screen: notes-selected chip picker + free-text personal notes, submitted as one evidence payload before the session can complete. Final Third internally represents 3 merged session numbers (S16/17/18) in one screen — the UI may show these as one flowing sub-narrative but must not fabricate 3 separate completion signals where the code only tracks one.

## Scorecard (S19-20)
6-category rating (each category a real control, not a single average slider) → personal notes → submit. Server computes the overall weighted score — never trust or display a client-computed overall.

## Golden Box Rules (supporting, part of the opening chain)
Read rules/principles → acknowledge (real checkbox, gates Continue) → Continue to Mentor Selection.

## Mentor Selection (supporting, part of the opening chain)
Browse mentor cards (up to 8, each with portrait/region/specialty/voice preview) → select up to 2 → Continue to Seed & Soil.

## Golden Box (post-game competition, real backend flow)
Create entry → Build Studio (wrapper/binder/filler/vitola component picker + optional strength/body/pairing attributes) → Presentation → Defense (pairing rationale) → Submit → (separate judge-side: assign judge → rubric-based scorecard → finalize → award). This is a real, multi-actor backend system — do not compress it into a single "submit" step in the UI.

## Passport Stamp (S23)
Eligibility check (server-computed from real completed sessions, never client-submitted) → claim (real, idempotent, server-owned stamp).
