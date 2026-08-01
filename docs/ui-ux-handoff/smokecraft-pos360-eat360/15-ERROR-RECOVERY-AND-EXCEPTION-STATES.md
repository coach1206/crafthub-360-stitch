# 15 — Error Recovery and Exception States

## Design philosophy already established in this codebase

The most consistent, real pattern across proven parts of this platform is
**honest degradation**: when something can't be verified or persisted,
the UI says so explicitly, in visible copy and/or a distinct badge style,
rather than hiding the gap or pretending success. A UI/UX developer
extending this platform should follow this existing convention, not
invent a new one.

## Real, shipped exception-state patterns to reuse

1. **Local-preview / local-fallback mode** (`StaffPinScreen.jsx`,
   `smokecraftHandoffService.js`): when a backend call fails, the UI
   falls back to a clearly labeled local/demo mode rather than blocking
   the user or crashing. `StaffPinScreen`'s local-preview PIN error text
   is a model example: *"Invalid PIN. (Local Preview Mode: use PIN 1234
   to demo.)"* — states the mode, states the workaround, no ambiguity.
2. **Manual handoff fallback** (`ManualPOS360HandoffPanel.jsx`): when
   automated sync fails, present a manual action path immediately, with
   a persistent, low-emphasis-but-visible status footer
   (`manual_pos360_handoff · pos_sync_pending · not_persisted`).
3. **Broken-image graceful hide** (Venue Humidor Media Management):
   `onError` handlers hide broken `<img>` elements rather than showing a
   broken-image icon.
4. **Server-side validation before DB errors reach the user**: the media
   management pass's own pre-commit bug fix (`assertProductBelongsToVenue`)
   is the right shape — validate input format before querying, return a
   clean `invalid_product_assignment` (422) rather than a raw Postgres
   error surfaced as a 500. Apply this standard to any new form:
   client-readable error codes, never raw stack traces or DB error
   strings (matches the proven `sendError()` controller convention).
5. **Safe error-code vocabulary, not free-text** (proven in RBAC/security
   doc): every mutation handler across Venue Humidor uses a fixed error-
   code vocabulary. New POS360/E.A.T. work should follow the same
   contract for consistency and easier client-side handling.

## Known real exception states a developer must design for (not hypothetical)

| State | Where it appears | Required treatment |
|---|---|---|
| `backendConnected: false` / `orderStatus: 'local_fallback'` | POS360 order-intent bridge | Immediate, visible fallback UI (manual handoff panel), never a silent retry loop |
| `not_persisted` | Manual handoff footer | Persistent, low-emphasis badge, must remain visible until resolved |
| `manager_approval_required` | Staff status badges | Should visibly block/hold the action pending approval — approving UI location is a real gap, see `18-...CHECKLIST.md` |
| `preview_fallback` | Generic staff-state fallback | Same treatment as `not_persisted` |
| Oversized upload hitting the wrong layer (`413` from body-parser instead of the intended validator message) | Venue Humidor media upload | Known limitation, not fixed — a new upload UI should catch this specific case and show the correct user-facing message regardless of which layer actually rejected it |
| SSRF-blocked / disallowed-domain import (`422`) | Venue Humidor media URL import | Already proven to reject cleanly; reuse the same allowlist pattern for any new remote-fetch feature |
| Broken/incomplete media asset | Any product image | Hide element via `onError`, never crash or show broken-image icon |

## Recommendations for POS360/E.A.T. specifically (currently underspecified)

- No proof or source evidence was found of a dedicated "offline/POS-sync-
  lost" banner pattern for POS360 beyond the SmokeCraft-order-specific
  bridge above, despite `/pos3/sync` (`POS360OfflineSync`) existing as a
  screen. A developer building this out should extend the existing
  `local_fallback`/`not_persisted` vocabulary rather than inventing a new
  one, for platform consistency.
- E.A.T. 360 has no visible dedicated error/exception-state pattern in
  source; it should inherit the same conventions documented here rather
  than developing an independent style.
