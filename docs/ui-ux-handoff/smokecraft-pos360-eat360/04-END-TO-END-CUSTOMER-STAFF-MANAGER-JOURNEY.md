# 04 — End-to-End Customer → Staff → Manager Journey

## Honesty framing

The **customer half** of this journey (enroll → play → order → track) is
real, server-verified, and screenshot-proven. The **staff half**
(receive/fulfill in POS360) and **manager half** (oversight in E.A.T.
360) are real routed UI but have no dedicated proof package — treat the
staff/manager steps below as the intended design, verified to exist as
code, not verified as a working end-to-end flow.

## Stage 1 — Guest enrolls and plays (proven)

1. `/smokecraft/welcome` → orientation dashboard.
2. `/smokecraft/enroll` → guest identity created.
3. `/smokecraft/venue-select` → guest picks/skips a venue (ties commerce
   to a specific location).
4. `/smokecraft/mentor-selection` → mentor context set.
5. 21 curriculum sessions play out across phases (see
   `smokecraftRequiredInteractions.js` for exactly which sessions are
   server-graded vs. locally-captured-only).
6. `/smokecraft/scorecard`, `/smokecraft/passport-stamp`, `/smokecraft/rewards`
   → XP/rank/Passport stamp awarded server-side.

## Stage 2 — Guest browses and orders (proven)

7. `/smokecraft/venue-humidor` → live catalog for the selected venue.
8. `/smokecraft/venue-humidor/:cigarId` → product detail.
9. `/smokecraft/venue-humidor/checkout` → cart/payment intent.
10. `/smokecraft/venue-humidor/order/:orderId` → confirmation.
11. `/smokecraft/orders`, `/smokecraft/orders/:orderId` → order
    tracking/detail.
12. `/smokecraft/orders/:orderId/pickup`, `/receipt` → pickup and receipt.

## Stage 3 — Order reaches staff (real code, unverified end-to-end)

13. The order becomes visible to venue staff through **two parallel
    surfaces** that this codebase does not visibly reconcile:
    - Venue Humidor Admin's own order queue:
      `/smokecraft/admin/humidor/orders` → `.../orders/:orderId` →
      `.../orders/:orderId/handoff` (`VenueHumidorHandoff` screen).
    - POS360's `smokecraftHandoffService.js`, which calls
      `POST /api/pos360/smokecraft/order-intent` to create a "POS360
      order intent" from a SmokeCraft/Venue Humidor order — with an
      **explicit local-fallback path** (`pos360LocalFallback()`) that
      returns `backendConnected:false, orderStatus:'local_fallback'`
      when the POS360 backend isn't reachable.
14. If real POS sync doesn't occur, `ManualPOS360HandoffPanel` is the
    fallback UI: a staff member manually creates a
    `manual_pos360_handoff` record, explicitly labeled in its own footer
    copy as `manual_pos360_handoff · pos_sync_pending · not_persisted`.
    This is a real, disclosed **degraded-mode UI**, not a bug — but it
    means "not_persisted" is a real state a developer must design for,
    not an edge case to ignore.

## Stage 4 — Staff fulfills (real UI, unverified end-to-end)

15. Staff work the order through POS360: `/pos3/orders` (order
    lifecycle screen `POS360OrderLifecycle`), `/pos3/fulfillment-kds`,
    `HumidorControl`/`InventoryControl` screens, `/pos3/handheld` for
    table-side action.
16. Status badges (`StaffStatusBadge.jsx`) carry a real, finite state
    vocabulary: `staff_order_preview`, `staff_assisted_preview`,
    `manager_approval_required`, `manager_approved_preview`,
    `manager_rejected_preview`, `manual_pos360_handoff`,
    `pos_sync_pending`, `table_layout_preview`, `floor_layout_preview`,
    `section_layout_preview`, `staff_order_cancelled`,
    `preview_fallback`, `not_persisted`. Several of these states'
    literal names (`*_preview`, `not_persisted`, `preview_fallback`)
    signal that this whole subsystem is itself still preview/scaffold
    tier — a UI/UX developer should treat every one of these badges as
    "this state must be visibly, honestly communicated to the staff
    user," not styled to look more final than it is.

## Stage 5 — Manager oversees (real UI, unverified end-to-end)

17. `/eat/command-hub`, `/eat/pos-control`, `/eat/operations` give
    cross-cutting visibility.
18. `/eat/inventory`, `/eat/reorders` give inventory authority/reorder
    signal review.
19. `/eat/reports`, `/eat/data` give reporting.
20. `/eat/smokecraft-panel` gives a management-side view specifically
    into SmokeCraft activity.
21. `manager_approval_required` / `manager_approved_preview` /
    `manager_rejected_preview` badges (Stage 4) imply some order actions
    require manager approval — the approving screen for this was not
    conclusively located in `/eat/*`; flagged as an implementation gap in
    `18-UIUX-DEVELOPER-IMPLEMENTATION-CHECKLIST.md`.

## Diagram

See `diagrams/customer-journey.md`, `diagrams/customer-to-pos360-handoff.md`,
and `diagrams/pos360-to-eat-escalation.md` for the Mermaid versions of the
above.
