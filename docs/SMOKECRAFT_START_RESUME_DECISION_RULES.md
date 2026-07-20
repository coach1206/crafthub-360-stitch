# SmokeCraft 360 — Start / Resume Journey Decision Rules

## Original bug

`src/pages/SmokeCraft.jsx` computed its primary-CTA label as:

```js
const isReturning = entryRoute === '/smokecraft/resume'
```

`entryRoute` (`getEntryRoute()`) becomes `/smokecraft/resume` once the guest
has completed only two Entry-layer steps: `enroll` and venue selection. It
does **not** check whether the guest has any real journey progress beyond
that. A guest who enrolled and picked a venue — and never opened Golden Box,
never selected a mentor, never started a single numbered session — was shown
`RESUME JOURNEY →` on the approved landing artwork, positioned over the
baked `START SMOKECRAFT` zone.

## Root cause

Conflation of two different questions:

1. "Which screen should Continue route to?" (`getEntryRoute()` — correctly
   hands off to `/smokecraft/resume`, which is itself the correct
   Resume-or-Start-New decision screen and was never wrong).
2. "Does this guest have real, resumable progress?" (never actually asked by
   the Landing screen before this fix — it assumed yes whenever question 1
   resolved to the Resume route).

`ResumeJourney.jsx` (the screen `entryRoute` hands off to) already asks
question 2 correctly, via `hasProgress`:

```js
const PRESERVED_COMPLETED_STEP_IDS = ['enroll']
const hasProgress = completedSteps.some(id => !PRESERVED_COMPLETED_STEP_IDS.includes(id))
```

This is the one existing, already-tested, canonical definition of "real
resumable progress" in this codebase. The Landing screen's CTA label was
never wired to it.

## Valid resume definition (now shared by both screens)

`PRESERVED_COMPLETED_STEP_IDS = ['enroll']` is now exported from
`ResumeJourney.jsx` and imported by `SmokeCraft.jsx`. A guest has real,
resumable progress **only if** `completedSteps` contains at least one id
other than `enroll` — i.e. they have actually completed Golden Box,
selected a mentor, or started/completed any numbered session. Identity
data, venue selection, and the guest-session shell alone never count.

## Invalid resume conditions (Landing CTA shows Start Journey)

- Completely fresh visitor (no `novee_guest_session` at all).
- Guest session exists, `completedSteps` is empty.
- Identity/enroll completed only.
- Venue selected only (venue selection writes no `completedSteps` entry at
  all — confirmed via `VenueSelect.jsx`).
- Any state where `completedSteps` contains only `enroll`.

## Migration / self-heal behavior preserved

The existing stale-`/format`-resumeRoute migration in
`SmokeCraftJourneyContext.jsx` (added in the prior Authoritative Journey
Graph package) is untouched. A guest with real progress (e.g. completed
`mentor`) whose persisted `resumeRoute` is the stale `/smokecraft/format`
still correctly shows `RESUME JOURNEY →` on Landing (they have real
progress) and is safely routed through `/smokecraft/resume`'s
`resolveSafeResumeTarget()`, which self-heals the target — this package
changes nothing about that resolution logic, only the Landing label's input.

## Start Journey route

Unchanged: `getEntryRoute()` → `/smokecraft/enroll` (not yet enrolled) →
`/smokecraft/venue-select` (no venue) → `/smokecraft/resume` (both done).
Every fresh/invalid-resume guest still lands on the same hand-off chain as
before; only the CTA **label** changed, never the destination.

## Resume Journey route

Unchanged: same `/smokecraft/resume` hand-off, which uses its own
`resolveSafeResumeTarget(currentAllowed, journey.resumeRoute)` to compute the
actual resume screen. Landing never bypasses this resolver — it only decides
what to call the button.

## Completed journey behavior

Not modified in this package. A guest who finished `session-complete` still
has real progress (`completedSteps` contains far more than `enroll`), so
Landing correctly shows `RESUME JOURNEY →`, and `/smokecraft/resume` already
shows the dedicated "Journey Completed" + "Review Completed Journey" /
"Start New Journey" UI (pre-existing, unchanged). This package did not add a
third Landing CTA state — the two-state Start/Resume label was preserved
exactly as specified (no redesign of the approved zone).

## Tests

`verify-smokecraft-start-journey-crafthub-mvp2.mjs` — 11 SmokeCraft CTA
cases (fresh, no-progress, identity-only, venue-only, valid mid-journey
progress, stale-route-with-real-progress, completed journey, corrupted
route, refresh persistence, no duplicate CTA text, no reward-on-load) plus 7
CraftHub cases. Full existing regression battery re-run clean (see final
report).
