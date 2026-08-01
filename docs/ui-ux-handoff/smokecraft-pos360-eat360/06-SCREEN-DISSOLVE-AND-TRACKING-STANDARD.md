# 06 — Screen Dissolve and Tracking Transition Standard

## Correction vs. the task brief's assumption

The task brief anticipated this pattern might not exist yet. **It does
exist, live, wired end-to-end for staff mode-switching** — more than was
assumed. What does **not** exist is its use for the *customer order
tracking* handoff specifically (guest placing an order and staff seeing
it appear) — that gap is real and is called out below.

## What is real and shipped

- `src/components/transitions/RippleDissolveTransition.jsx` — "premium
  gold ripple + smoky dissolve overlay." Props: `active`, `onComplete`,
  `target` (`'pos360' | 'pos3' | 'eat' | 'smokecraft' | 'guest'`),
  `durationMs` (default `1100`). Two-stage animation: `ripple` →
  `dissolve` (dissolve begins at 40% of duration), calls `onComplete`
  at 100%. Renders a target-specific label ("Opening POS 360…",
  "Opening E.A.T.…", "Returning to SmokeCraft…", "Returning to
  Guest…").
- `src/pages/staff/StaffPinScreen.jsx` (route `/staff/pin?target=eat|pos360`)
  — the real, live use of this pattern. Flow: guest resume state is
  saved → staff enters PIN on a large numeric keypad → PIN verified
  against `POST /api/auth/staff-pin-login` → **on success, the ripple
  dissolve plays, then navigates to the target system** (`/eat` or
  `/pos3`) → **Cancel plays the dissolve in reverse** and restores the
  saved SmokeCraft route.
- **Explicit, disclosed local-preview PIN fallback**: if
  `/api/auth/staff-pin-login` is unreachable, the screen accepts a fixed
  demo PIN (`1234`) and clearly labels the error state
  ("Local Preview Mode: use PIN 1234 to demo") rather than silently
  failing or pretending to be secure. The component's own header comment
  states: *"Does not store PINs. Does not claim production security if
  backend unavailable. Local-preview mode is clearly labeled."*
- `src/components/staffhandoff/StaffHandoffButton.jsx` and
  `ReturnToGuestButton.jsx` — a second, related pair of components using
  a sibling `RippleDissolve.jsx` for the guest-device-becomes-staff-device
  handoff pattern (as opposed to `StaffPinScreen`'s dedicated-staff-login
  pattern).
- CSS: `src/components/transitions/rippleDissolve.css`.

## What is a real gap [SPEC / GAP]

- **Order tracking status transitions** (a guest's order moving from
  placed → received-by-staff → preparing → ready → picked up) do **not**
  use `RippleDissolveTransition` anywhere found in this codebase. Order
  status is shown via `StaffStatusBadge` color/text changes and
  Venue Humidor's own order-detail/receipt screens — a plain state
  re-render, not a transition effect. If a UI/UX developer wants a
  dissolve-style moment for order-status changes (e.g., a customer's
  `/smokecraft/orders/:orderId` screen visibly "confirming" a staff pickup
  scan the way `StaffPinScreen` visibly confirms a staff login), that is
  new work, not an extension of existing behavior. **Recommendation**:
  reuse `RippleDissolveTransition` with a new `target` value (e.g.
  `'order-update'`) rather than building a parallel transition component
  — the component is already parameterized for this.
- No screenshot proof exists of the dissolve transition actually playing
  in a browser (no proof package screenshots capture the mid-animation
  state) — its wiring is verified by source read, not by visual/browser
  test evidence.

## Implementation standard for any new use of this pattern

1. Always mount `RippleDissolveTransition` conditionally (`active`
   controls mount, matching the existing usage) — never leave it
   permanently mounted with `active=false` and toggling internal state,
   to avoid animation-restart bugs.
2. Keep `durationMs` at `1100` unless there's a strong UX reason to
   change it — this is the value used consistently across all three real
   call sites (`StaffHandoffButton`, `StaffPinScreen`,
   `ReturnToGuestButton`).
3. Always add a new, human-readable `TARGET_LABELS` entry rather than
   falling back to the generic `Opening ${target}…` string for any
   customer-facing target.
4. `onComplete` must always perform the actual navigation — the overlay
   should never navigate itself mid-animation; this is the existing,
   correct contract.
