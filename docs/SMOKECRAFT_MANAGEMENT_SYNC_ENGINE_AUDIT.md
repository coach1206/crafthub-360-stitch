# SmokeCraft 360 — Management Sync Engine Audit (Phase 1)

## Component

`src/pages/smokecraft/ManagementSync.jsx` (77 lines, full file read).

## Current wiring (traced directly, not inferred)

1. **`useGuestSession()` fields used:** `session.xp`, `awardSessionRewards`.
2. **`useSmokeCraftJourney()` fields used:** `journey.selectedCigar`,
   `journey.pairing`, `journey.flavorMemory?.selectedFlavors`.
3. **localStorage keys:** none read directly by this component — it goes
   through the two context hooks above, which internally use
   `novee_guest_session` and `sc_journey_v1` (established elsewhere this
   session).
4. **sessionStorage keys:** none.
5. **IndexedDB/offline storage:** none.
6. **Management Sync-related services found:**
   `server/services/smokecraft/smokecraftEatSyncBridgeService.js`.
7. **Management Sync-related API routes:** none found calling this service
   from the SmokeCraft frontend (`grep -n "fetch("
   src/pages/smokecraft/ManagementSync.jsx` → zero matches).
8. **Management Sync-related database tables:** `eat_management_sync_events`
   referenced once in `server/services/venueCommerceService.js` (in a
   different, POS-order context — see below).
9. **Purpose of `eat_management_sync_events`:** an INSERT statement inside
   `venueCommerceService.js` for POS/order commerce events, unrelated to
   SmokeCraft journey/pairing/satisfaction data. Not called by anything in
   the SmokeCraft journey flow.
10. **Why the current service is `preview_only`:** read directly from its
    own source (`smokecraftEatSyncBridgeService.js`, full file, 115 lines):
    `getEatSyncStatus()` hardcodes `connected: false`; `canSyncToEAT()`
    hardcodes `return false`. This is a deliberate, self-documenting
    placeholder — its own top-of-file comment states: *"Returns honest
    not_connected status when E.A.T. is unavailable. Never invents E.A.T.
    success."*
11. **Does preview_only code perform a real write?** No. `_syncEventLog`
    is a plain in-memory JS array (`const _syncEventLog = []`) — not a
    database table, not persisted, reset on every server restart.
12. **Does preview_only code read real data?** No — it only accepts
    whatever order/event object is passed to it and echoes back a
    `not_connected`/`preview_only` status.
13. **Does preview_only code contain demo values?** No fabricated values —
    it is honest about being non-functional.
14. **Is authentication enforced?** N/A — no real request path exists to
    protect.
15. **Is venue ownership enforced?** N/A — same reason.
16. **Is journey ownership enforced?** N/A — same reason.
17. **Is session ownership enforced?** N/A — same reason.
18. **Does an audit log exist?** Only the in-memory, non-persistent
    `_syncEventLog` array — not a real audit log (lost on restart, not
    queryable, not venue/user scoped).
19. **Does idempotency exist?** No.
20. **Does Management Sync currently write anything?** No — confirmed via
    `grep -n "fetch(\|axios\|syncSmokeCraft"
    src/pages/smokecraft/ManagementSync.jsx` → zero matches. The
    `smokecraftEatSyncBridgeService.js` functions (`syncSmokeCraftOrderToEAT`,
    etc.) are never imported or called by this component.
21. **Does Management Sync currently only display local state?** Yes,
    confirmed — 4 fields only (`cigar.name`, `pairing.recommendation`,
    `session.xp`, `flavors.join(', ')`), all from local
    `GuestSessionContext`/`SmokeCraftJourneyContext`.
22. **Disconnected fields:** every field in "Top Summary" (Journey Sync
    Status, Data Shared, Guest Impact Score, Venue Benefit), every field in
    "Management Insights" (Top Performing Pairing, Most Selected Cigar,
    Guest Satisfaction, Repeat Visit Potential), and every field in "Venue
    Operations Impact" and "Sync Activity" — **none of these render any
    React content at all**. They are baked blank field boxes in the
    approved image with zero code-level overlay of any kind (not even an
    empty div) — confirmed by reading the full 77-line component file.
23. **Hardcoded values:** none found (contrary to earlier concern —
    "2500 XP" was confirmed test-seed data, not hardcoded, in the prior
    package).
24. **Placeholder values:** none rendered — the fields are simply absent
    from the component, not populated with placeholder text.
25. **Demo values:** none.

## Conclusion of Phase 1

There is **no real backend destination anywhere in this codebase** capable
of supplying venue-wide aggregated metrics (Top Performing Pairing, Most
Selected Cigar, Guest Satisfaction trend, Repeat Visit Potential, or any
Venue Operations Impact figure). The only related service
(`smokecraftEatSyncBridgeService.js`) is explicitly, deliberately, and
honestly a non-functional preview stub for a completely different purpose
(POS/E.A.T. order-status bridging, not SmokeCraft journey analytics), with
no persistent storage, no authentication, and no venue/user scoping to
build on. Building a real aggregation engine would require **new**
infrastructure (a persistent completed-journeys table, real
authentication/venue-scoping middleware, and aggregation queries) — this
is new backend feature work, not "completing" something that already
exists in a testable, reviewable state.

Per this task's own Phase 7 fallback rule — *"If the current backend
service cannot safely support real writes: do not fake the write; mark the
sync destination NOT CONNECTED; keep the action disabled; document the
missing backend work"* — that is the responsible action here, and is what
was implemented this pass (see
`docs/SMOKECRAFT_MANAGEMENT_SYNC_DATA_MAP.md` and the honest-empty-state
change to `ManagementSync.jsx`), rather than fabricating a backend
integration that cannot be safely reviewed for cross-user/cross-venue data
leakage within this pass's time.

## Addendum — Architecture package (this pass)

This finding stands unchanged and is not replaced. A follow-up,
documentation-only architecture package has since produced a complete,
implementation-ready design for the "new backend feature work" identified
above — see `docs/SMOKECRAFT_MANAGEMENT_SYNC_BACKEND_ARCHITECTURE.md`
and the sibling `SMOKECRAFT_MANAGEMENT_SYNC_*` documents (data-source
audit, database schema, API contract, security model, idempotency
design, metric definitions, destination audit, migration/rollback plan,
implementation plan, architecture validation). No backend code,
migration, or frontend wiring was added by that package — it remains
planning only, pending explicit approval to begin Package A.
