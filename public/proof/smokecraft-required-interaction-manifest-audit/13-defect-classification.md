# Defect Classification

Highest existing SmokeCraft defect number: SC-D066.

## No new SC-D number assigned this pass

Per the mandate's own instruction: "Do not assign defects merely
because a session lacks a newly defined interaction that was never
previously implemented or promised in code." The 12 PARTIAL/VISUAL_ONLY
sessions identified this pass are **missing planned scope relative to
this pass's own newly-created definition of "required interaction"**
— they were never previously promised, in code or in a prior canonical
document, to have server-evaluated scoring. The prior
`SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md` explicitly left this as
an open, unconfirmed question rather than asserting these sessions were
broken — so this pass's finding is a **scope/architecture gap newly
identified**, not a **confirmed pre-existing functional defect**
(nothing was ever claimed to work that doesn't).

## Classification of the 13 non-complete sessions

- **12 sessions (3, 4, 5, 6, 8, 10, 12, 15, 16, 19, 2, 23)**: Missing
  planned scope / architectural ambiguity — no server-side evaluation
  of a real interaction; whether one is even required per-session is
  partly an owner product decision (see Package C/D above), not purely
  an engineering gap.
- **1 session (25)**: Unverified coverage — implementation likely
  correct, not independently confirmed this pass.

## Owner decisions required

3 (Packages C, D, and part of B) — see
`12-implementation-package-plan.md` for exactly what each decision
entails.
