# 05 — Customer-to-POS360 Handoff

## What is real

- `src/services/smokecraftHandoffService.js` — a real client service with
  functions to create a POS360 order intent from a SmokeCraft/Venue
  Humidor order (`createPOS360OrderIntent()`), targeting
  `POST /api/pos360/smokecraft/order-intent`.
- A **documented, deliberate local-fallback contract**:
  `pos360LocalFallback(area, extra)` returns
  `{ ok:false, backendConnected:false, orderStatus:'local_fallback', persistenceMode:'local_fallback', safeClaim:'pos360_smokecraft_order_bridge', area, ...extra }`
  whenever the POS360-side fetch fails. This is a first-class UI
  affordance the frontend must render honestly, not an error to swallow.
- `src/components/staff/ManualPOS360HandoffPanel.jsx` — a real fallback
  panel shown to staff when "POS sync has not occurred." Staff click
  **Create Manual POS360 Handoff**; the panel lists recent handoffs with
  `StaffStatusBadge`s for `handoff_status` and `pos_status`, and its
  footer explicitly reads `manual_pos360_handoff · pos_sync_pending ·
  not_persisted`.
- `src/pages/smokecraft/venueHumidor/VenueHumidorHandoff.jsx`
  (route `/smokecraft/admin/humidor/orders/:orderId/handoff`) — the
  venue-admin-side handoff screen for a specific order.
- `src/components/smokecraft/SmokeCraftHandoffTrigger.jsx` — the
  guest/staff-mode UI trigger component.
- `src/components/staffhandoff/ReturnToGuestButton.jsx` — the reverse
  direction (staff device returns to guest mode).

## What is not confirmed

- No proof package exercises this handoff live end-to-end (no
  `verify-*handoff*.mjs`-style script output was found under
  `public/proof/` for POS360 specifically — Venue Humidor's own order
  queue/handoff screens are separately proof-covered but the
  cross-system POS360 bridge is not).
- Whether `POST /api/pos360/smokecraft/order-intent` exists and responds
  successfully in a real environment was not verified as part of this
  documentation-only pass (no server code was executed).

## Recommended UX contract for a developer building/finishing this

1. **Always attempt the real bridge first** (`createPOS360OrderIntent`),
   never skip straight to manual mode.
2. **On any failure or `backendConnected:false`**, show the manual
   fallback panel immediately — do not silently retry forever or block
   the staff member from acting. The existing copy ("POS sync has not
   occurred. Staff must enter this order into the POS manually.") is the
   right tone: honest, action-oriented, non-alarming.
3. **Never let a `not_persisted` / `local_fallback` / `preview_fallback`
   state visually read as "done."** Use a distinct, lower-emphasis badge
   style (the existing yellow/orange treatments in `StaffStatusBadge.jsx`
   are correct — keep that pattern) and keep the literal state string
   visible somewhere for staff/support debugging, exactly as the current
   panel footer does.
4. **The handoff should carry, at minimum**: venueId, guestId,
   smokecraftSessionId, passportSessionId, cigarReference or
   menuItemReference, quantity, modifiers, full orderPayload,
   orderSource, orderType — this is the real parameter shape already
   defined in `createPOS360OrderIntent()`; don't invent a different
   payload shape.
5. **This is also the natural place to trigger the confirmed screen
   dissolve/tracking transition** (`RippleDissolveTransition`, `target=
   'pos360'`) — see `06-SCREEN-DISSOLVE-AND-TRACKING-STANDARD.md` for why
   this is currently a gap, not a shipped behavior.
