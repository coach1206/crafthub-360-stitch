# SmokeCraft 360 — Integrations & Touchpoints (Doc 9 of 10)

Every claim below was checked against the actual route/service/component
source on `integration/smokecraft-main-candidate` — not assumed from a
naming convention. Where a wired call was found to have no real backend
route behind it, or a save exists with no matching restore, that's stated
plainly rather than smoothed over. This doc supplements doc 05 (Integration
Map, which covers what code was pulled onto the branch and why) with what
each integration actually **does** at runtime — the touchpoints, payload
shapes, and honest gaps.

---

## 1. POS360

Base routes: `/api/pos360/smokecraft/*` (mounted from
`server/routes/pos360SmokeCraftOrderBridgeRoutes.js` →
`pos360SmokeCraftOrderBridgeService.js`).

| Requested touchpoint | How it's actually implemented |
|---|---|
| **Guest/session** | Every write carries `guestId`, `smokecraftSessionId`, and `passportSessionId`. Guest identity is never invented server-side — it comes from `smokecraftGuestIdentity` middleware (cookie-based guest id or authenticated user id), the same identity resolution used across every SmokeCraft-adjacent backend surface. |
| **Selected cigar** | `cigarReference` field on order intents (`pos360_smokecraft_order_intents.cigar_reference`) and on menu-item references. Populated from `RequestPurchase.jsx`'s call to `createOrderIntent()` (`src/services/smokecraft/pos360OrderBridgeApiClient.js`). |
| **Table/seat if applicable** | **Not present in this bridge's schema.** No `tableId`/`seatId` column exists on `pos360_smokecraft_order_intents` or the handoff tables. The *client-side* staff-handoff payload (`buildHandoffPayload()` in `src/services/staffHandoffService.js`) does carry an optional `tableId`, but it is never sent to this POS360 bridge — it only travels inside the local `sessionStorage`-held handoff object consumed by the (separate, older) `StaffHandoffButton.jsx` flow. There is no persisted table/seat linkage in the database layer. |
| **Cart/order** | `pos360_smokecraft_order_intents` — `quantity`, `modifiers_json`, `order_payload_json`, `order_source` (default `'smokecraft'`), `order_type` (default `'cigar_request'`). Created via `POST /api/pos360/smokecraft/order-intent`. |
| **Cigar/drink/food/bundle** | `menu_item_reference` + `pairing_reference` on `pos360_smokecraft_menu_item_refs`, attached via `POST /api/pos360/smokecraft/menu-item-reference` (`attachSmokeCraftMenuItemReference`) — separate from the order intent itself, allowing a cigar + pairing + bundle to be referenced against one order. |
| **Purchase request** | `createSmokeCraftOrderIntent` → `orderStatus: 'pending_staff_review'` is the initial state; a staff member later calls `recordSmokeCraftStaffAction` with `actionType: 'order_fulfilled'` to close it. Distinct from a `createSmokeCraftHandoffRequest` (a lighter-weight "ask a human to help" signal, `orderStatus: 'pending_staff_action'`), which `Choose Your Ordering Path` (S9 Request/Purchase screen) also exposes as its "Request Staff Assistance" option (confirmed in the current visual proof — see doc 06). |
| **Transaction linkage** | `order_intent_id` and `handoff_id` are the join keys threaded through every downstream table: staff actions, sync-status rows, and the audit log (`pos360_smokecraft_order_audit_log`) all carry them. All writes are idempotent — `idempotencyKey` on order-intent creation and on the loyalty ledger entry (`pos360-fulfilled-${orderIntentId}`) means a retried/duplicated request can never create a second order or double-pay loyalty points. |
| **Loyalty after payment** | Loyalty accrual fires from exactly **one** real event: a staff member marking an order `order_fulfilled` via `recordSmokeCraftStaffAction`. It resolves the SmokeCraft-side guest/venue/tenant ids to real POS360 UUIDs through `pos360SmokeCraftIdentityMappingService.resolveFullIdentity()` (a governed, persisted, idempotent find-or-create mapping — never mints a new POS360 identity on retry), then credits `POINTS_PER_FULFILLED_ORDER = 10` into the **existing, real POS360 loyalty ledger** (`pos360_loyalty_profiles` / `pos360_loyalty_points_ledger`) — entirely separate storage from SmokeCraft's own gameplay XP, so a SmokeCraft "level up" is never confused with a real loyalty-points award. Never triggered by request creation, only by confirmed fulfillment. |

### POS360 identity mapping

`pos360SmokeCraftIdentityMappingService.js` — resolves
`{ smokecraftVenueId, smokecraftTenantId, smokecraftGuestId }` into
`{ pos360VenueUuid, pos360TenantUuid, pos360CustomerId }`. This is the
**only** place a POS360 UUID is created for a SmokeCraft identity — no other
function in this branch mints one independently, which is what keeps loyalty
accrual from ever double-crediting or targeting the wrong POS360 customer
row on a retried request.

---

## 2. E.A.T.

Base routes: `/api/eat-360/smokecraft/*` (mounted from
`server/routes/eatSmokeCraftLiveSyncRoutes.js` →
`eatSmokeCraftLiveSyncService.js`).

| Requested touchpoint | How it's actually implemented |
|---|---|
| **Management sync** | `POST /session/sync` → `syncSmokeCraftSessionToEAT()`, writing `eat_smokecraft_session_sync` with `sessionStatus`, `completedRoute`, `completedSteps`, `xpSummary`, `stampSummary`, `tasteProfile`. Idempotent on `idempotencyKey`. Fired live from `SessionComplete.jsx` (S27) via `smokecraftManagementSyncService.syncManagement()` — confirmed a real, wired call, not just a defined-but-unused service. |
| **Inventory signal** | `POST /inventory-signal` → `createSmokeCraftInventorySignal()`, writing `eat_smokecraft_inventory_signals` with `cigarReference`, `menuItemReference`, `inventorySignalType` (default `'interest'`), `quantitySignal`, `reorderSignal`. Fired from `SessionComplete.jsx` when a cigar was selected, via `createInventorySignalSync({ venueId, cigarReference })`. |
| **VIP review/follow-up** | `recordSmokeCraftGuestActivity()` (`POST /guest-activity`) carries an explicit `vipSignal` boolean and `loyaltySignal` field on `eat_smokecraft_guest_activity`. **Separately**, the older `smokecraftHandoffService.syncToEAT()` client function accepts `vipCandidateSignal` and `recommendedFollowUp` params aimed at the exact same concept — but that function POSTs to `/api/venues/eat/sync`, a route that **does not exist anywhere in `server/routes/`**. It is called from nowhere in the current frontend (`grep` for `syncToEAT` finds only its own definition), so it is effectively dead code on this branch, not a live VIP/follow-up path. The live path is `recordSmokeCraftGuestActivity`'s `vipSignal` field. |
| **Guest preference capture** | `activitySummary` + `flavorTags` on `eat_smokecraft_guest_activity` (via `recordGuestActivity`), and the broader taste profile captured through Passport's `saveSmokeCraftFlavorMemory`/`saveSmokeCraftTastingProfile` (see §3) — flavor/taste data isn't duplicated into two competing stores; E.A.T.'s activity row is a lightweight signal, Passport's flavor-memory table is the fuller record. |
| **Operational notes** | `alertMessage` on `eat_smokecraft_manager_alerts` (`createSmokeCraftManagerAlert`, e.g. `alertType: 'session_completed'`, fired from `SessionComplete.jsx`), and `sync_notes`-equivalent free text carried through the handoff queue's `handoffPayload` JSON. There's no separately-named "operational notes" table — notes travel as fields on whichever event they're attached to (alert, activity, handoff). |

### Real, currently-wired E.A.T. call sequence (session completion)

Confirmed directly in `SessionComplete.jsx`, fired once per guest (guarded
by `completedSteps.includes('session-complete')`), fire-and-forget so a
backend failure never blocks or falsely-succeeds the guest's own completion:

1. `syncManagement()` → session sync (`completedRoute`, `xpSummary`, `stampSummary`, `tasteProfile`)
2. `recordGuestActivity({ managerVisibility: true })`
3. `createManagerAlertSync({ alertType: 'session_completed' })`
4. `createInventorySignalSync({ cigarReference })` — only if a cigar was selected
5. `writeEATSyncAuditEvent({ eventType: 'session_complete_sync' })`

All wrapped in a single `try { … } catch { /* honest degraded state, never surfaced as false success, never rolls back gameplay completion */ }` — matching the documented `backendConnected: false` fallback contract every service in this branch follows (see doc 05's "never fakes `backendConnected: true`" note, verified consistently in both service files above).

---

## 3. Passport / Rewards / Collections / Challenges

Two related-but-distinct backend surfaces exist for Passport:

- **`/api/passport-360/smokecraft/*`** (Phase F.5, unauthenticated,
  `passport360SmokeCraftPersistenceService.js`) — the original persistence
  layer.
- **`/api/passport-360/sync/*`** (`passport360SyncRoutes.js`,
  guest-identity-gated) — the current, authenticated sync surface used by
  the live Passport screens; deliberately kept separate rather than
  retrofitted onto the unauthenticated routes (per that route file's own
  comment, pointing at `docs/audits/passport-360-completion/01-ARCHITECTURE-AUDIT.md`).

| Requested touchpoint | How it's actually implemented |
|---|---|
| **Session completion** | `saveSmokeCraftSessionToPassport()` writes `passport_360_smokecraft_sessions` (`sessionStatus`, `completedRoute`, `completedSteps`, `tasteProfile`, `xpSummary`, `stampSummary`, `startedAt`/`completedAt`). |
| **Passport stamp** | `awardPassportStampLive()` writes `passport_360_earned_stamps`, deduplicated via a real `dedupe_key = ${guestId}:${stampId}:${moduleKey}` with `ON CONFLICT (dedupe_key) DO NOTHING` — a duplicate claim is a genuine no-op, not a second stamp. Guest-facing flow: `PassportStamp.jsx` (S23) checks eligibility, restores any already-persisted claim from canonical journey state on mount (`journey.passportStamp?.claimed`), and only fires the claim once (`claimFiredRef` guard) — the server independently re-checks for a duplicate claim regardless of client state. |
| **Rewards credit** | `awardPassportXP()` — a real upsert (`ON CONFLICT (guest_id, module_key) DO UPDATE … total_xp = total_xp + EXCLUDED.total_xp`) against `passport_360_guest_progress`, so XP always accumulates rather than overwrites. **Server-authoritative XP amounts**: `server/services/smokecraft/sessionRewardTable.js` is the *only* place the server trusts an XP number from — it reads `SESSION_REWARDS` (the same constant the client displays from, so client/server can never disagree) and explicitly documents "no client-controlled XP or awards." |
| **Achievements** | Badges are 1:1 with session completion via `getSessionBadgeIds(sessionId)` (reads `SESSION_REWARDS[id].sessionBadges`), auto-granted in the same atomic transaction as session completion rather than left for the client to separately claim. Read back via `getGuestBadges()` against `passport_360_badges`. S25/S26 (`Rewards.jsx`) is the guest-facing surface for this. |
| **Collections** | `CollectionsCenter.jsx` (`/smokecraft/collections`) is a supplemental page (doc 03/04). It reads real evidence tables through the same append-only-overlay pattern Skill Tree uses (see below) rather than a separate "Collections" backend service — no dedicated `collectionsService.js` was found; collection state is derived, not independently stored. |
| **Challenge progression** | `smokecraft_progression_events` (migration 085, `progressionEventService.js`) is the shared, idempotent (`idempotency_key`) event log intended as the foundation for Skill Tree / Collections / Challenge Hub coordination. On this branch it is actively written to by Filler Arrangement's real `lesson_completed`/`knowledge_check_submitted` moments; Skill Tree's `progression_event_breadth` evidence check reads it back (≥2 distinct event types = a met node). Challenge Hub (`ChallengeHub.jsx`) and SmokeCraft Challenge (`SmokeCraftChallenge.jsx`, gated on `scorecard`) are the guest-facing surfaces; per-challenge server-side scoring beyond this shared event log was not found as a separate documented service in this pass. |
| **Next recommendation logic** | `src/services/smokecraft/recommendedJourneyService.js` — explicitly a **deterministic, rule-based** engine, not an AI call ("There is no AI service connected here … the screen must never claim otherwise," per the file's own header comment). Five categories (`humidor-expert`, `pair-and-impress`, `flavor-explorer`, `flavor-memory`, `community-events`), each scored only from real session/journey data already captured earlier in the visit (Knowledge Check scores, pairing selections, flavor-memory tags, winner eligibility). Surfaced on S27 Session Complete; a score of 0 means "no supporting data," never a guessed baseline, and the screen shows "Not enough saved activity yet to personalize a recommendation" rather than fabricating one. |

### Skill Tree's evidence-based model (the pattern Collections/Challenges lean on)

`skillTreeService.js` never trusts a client-submitted "I completed this
node" claim. Each of its 7 nodes is backed by a real evidence-table check
(e.g. `foundation` ← `smokecraft_seed_soil_progress` row count,
`mastery-blending` ← a real `golden_box_entries` row,
`community-legacy` ← ≥2 distinct `smokecraft_progression_events` types).
A staff-only correction/reversal path (`smokecraft_reward_corrections`) is
append-only — a corrected node is reported as a distinct `'corrected'` state
at read time, and the original `completed_at` evidence is never deleted or
edited.

---

## 4. Guest-to-staff handoff

**Two separate, non-unified implementations exist on this branch.** This is
the most important honest finding in this document — a designer or engineer
picking this up should know both exist rather than assume one consistent
flow.

### Implementation A — `StaffHandoffButton.jsx` (used on SessionComplete / CraftHub)

- Guest taps a discreet dot → reveals "Accept Staff Handoff."
- `StaffHandoffLoginModal.jsx` gates entry: in demo mode, no real credential
  check; in a real build with `STAFF_HANDOFF_AUTH_AVAILABLE === false`
  (the honest default — **"In production builds there is no backend
  endpoint for this email+PIN handoff auth yet"**, per the component's own
  comment), the form is replaced with a disabled "Staff Login Unavailable"
  message rather than shipping fake credential checking.
- On unlock, `buildHandoffPayload(session, { tableId, staffNotes })` builds
  a payload (session id, table id, selected cigar, pairing, humidor
  recommendation, purchase request, mentor selections, XP/rank/leaderboard)
  and `saveHandoff()` stores it in `sessionStorage` only (`smokecraft_staff_handoff`
  key) — never sent to any backend by this path.
- Transitions directly to `/pos3` (or `/pos3/tables` if a table id is set)
  or `/eat`, both real, routed destinations (confirmed in doc 03).
- **No return-to-guest step exists in this implementation** — it is a
  one-way transition into staff tooling.

### Implementation B — `SmokeCraftHandoffTrigger.jsx` (a separate component, same concept)

- Guest taps a discreet dot → "Request E.A.T. Handoff" / "Request POS360
  Handoff," explicitly labeled **"PILOT PREVIEW — Internal Only"** in the UI
  itself.
- **Save exact guest progress:** `saveGuestResumeState(session, { currentRoute, currentVisit, currentSession, venueId, handoffTarget })`
  → `staffHandoffResumeService.js` writes a real, detailed snapshot to
  `sessionStorage` (`sc_staff_handoff_resume`): current route, completed
  steps, badges, journey XP, skill score, challenge score, loyalty points,
  passport stamp count, guest/venue/tablet/cart/order ids, handoff target,
  timestamp. `saveHandoffMeta({ target, startRoute })` separately stores
  handoff routing metadata (`sc_staff_handoff_meta`) for the PIN screen to
  read.
- **Staff PIN / staff mode:** navigates to `navigate('/staff/pin?target=...')`.
  **This route does not exist in `src/App.jsx`** — confirmed by direct
  search, the only two references to `/staff/pin` in the whole codebase are
  this `navigate()` call and a checklist line in
  `SmokeCraftVenuePilotPackage.jsx` ("Confirm staff PIN flow is working
  (`/staff/pin`)"). Tapping this handoff option today navigates to a
  route with no matching `<Route>`, which will 404 or fall through to
  whatever catch-all route exists — it is not a completed flow.
- Also fires a best-effort, non-blocking POS360 handoff-request write
  (`createPOS360HandoffRequest` + `writePOS360AuditEvent`) to the *real*
  `/api/pos360/smokecraft/*` bridge described in §1 — this part **is** real
  and reaches the database.
- **Complete staff action:** no staff-side consumer of `sc_staff_handoff_resume`
  or `sc_staff_handoff_meta` was found anywhere in `src/` outside the file
  that writes them (`grep` for both storage keys and for
  `loadGuestResumeState`/`loadHandoffMeta` usage turns up only their own
  definitions). No screen currently reads this snapshot to show staff what
  the guest was doing.
- **Return to guest restores exact route and state:** `returnFromHandoff(handoffId)`
  exists in `smokecraftHandoffService.js` and POSTs to
  `/api/venues/handoff/${handoffId}/return` — **that route also does not
  exist in `server/routes/`**. The function is defined but never called
  from anywhere in `src/` (confirmed by `grep`). Its own fallback, if it
  ever were called, is `{ ok: true, storageMode: 'local_preview', localPreview: true }`
  — a stub acknowledgment, not an actual route/state restoration. There is
  no code path on this branch that reads back a saved resume snapshot and
  re-navigates the guest to their prior route with prior state intact.

### Net honest status of "guest-to-staff handoff" on this branch

| Sub-requirement | Status |
|---|---|
| Save exact guest progress | **Real** — `saveGuestResumeState()` captures a detailed, real snapshot to `sessionStorage` (Implementation B). A lighter-weight version also exists in Implementation A's `buildHandoffPayload()`. |
| Staff PIN / staff mode | **Partially real.** Implementation A's inline PIN modal is real (honestly gated off when no backend auth exists). Implementation B's PIN flow points at an unregistered route (`/staff/pin`) — not functional as wired. |
| Complete staff action | **Real, but only via a third path** — `recordSmokeCraftStaffAction()` (§1, POS360 bridge) is the actual, database-backed "staff completed an action" record (e.g. `order_fulfilled`), reachable once staff are already inside POS3/E.A.T. via other means, not through either handoff trigger's own completion step. |
| Return to guest restores exact route and state | **Not implemented.** `returnFromHandoff()` is defined, calls a non-existent backend route, and is never invoked. No frontend code reads `sc_staff_handoff_resume` back. A guest whose session was handed off has no automated way to be returned to their exact prior screen/state by this branch's code. |

This gap does not block the guest-facing canonical journey (doc 02/07) —
it only affects the staff-handoff side-flow, which sits outside the guarded
27-session spine. It's called out here so it isn't assumed working by
anyone reading only the component names.

---

## Summary table — what's real vs. not, at a glance

| Integration | Real, database-backed, live-wired | Defined but not reachable / dead code |
|---|---|---|
| POS360 order/handoff/staff-action/loyalty | ✅ all of §1 | Table/seat linkage (not persisted anywhere) |
| E.A.T. session sync / inventory / alerts / activity | ✅ all of §2's primary path | `syncToEAT()` (client fn → nonexistent `/api/venues/eat/sync`) |
| Passport session/stamp/XP/badges | ✅ all of §3 | — |
| Recommendation engine | ✅ real, deterministic, honestly labeled non-AI | — |
| Guest-to-staff handoff (save) | ✅ Implementation A + B both save real state | — |
| Guest-to-staff handoff (staff PIN) | ✅ Implementation A only | Implementation B → `/staff/pin` (unregistered route) |
| Guest-to-staff handoff (return to guest) | ❌ none | `returnFromHandoff()` → nonexistent `/api/venues/handoff/:id/return`, never called |

**Status: NOT MERGED into `main`. NOT DEPLOYED. NOT OWNER-APPROVED.** Same
standing constraints as the rest of this handoff package (doc 01/08) apply —
this document does not authorize or recommend a merge; it records what
exists on the branch as of HEAD `a39d5a7b`.
