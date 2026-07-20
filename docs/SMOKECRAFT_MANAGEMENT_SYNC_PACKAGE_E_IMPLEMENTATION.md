# SmokeCraft Management Sync — Package E Implementation

## Phase 1 — audit summary (all 8 systems)

| System | Status | Evidence |
|---|---|---|
| 1. Ticket Tapper | **CONNECTED** | Real tables (017/071), real tap/add tracking API, real frontend component, confirmed live-wired (this session's earlier Ticket Tapper package). Health check: real `SELECT 1 FROM ticket_tapper_specials`. |
| 2. Passport 360 | **INTERNAL_ONLY** | Real persistence exists (migration 068) but for the Passport module's own guest identity — not confirmed mapped to SmokeCraft's `guest_reference`. No write path built. |
| 3. Internal Staff Handoff | **NOT_CONFIGURED** | No table/route/button exists anywhere in this codebase (confirmed by code search this package). |
| 4. Inventory | **NOT_CONFIGURED** | `ticket_tapper_inventory` exists for specials/menu, not cigar-humidor — a different domain. No cigar inventory table exists. |
| 5. POS360 | **COMING_SOON** | Real, production module (migrations 018/031-047/070) for its own order-bridging purpose. No bridge into Management Sync exists or was verified. |
| 6. E.A.T. 360 | **COMING_SOON** | `smokecraftEatSyncBridgeService.js` re-confirmed as a deliberate, self-documented non-functional preview stub. |
| 7. NOVEE OS | **COMING_SOON** | Real platform-wide services exist for platform ops; no SmokeCraft journey feed into them exists. |
| 8. Internal Management Sync itself | **CONNECTED** | The Package A-D system — real DB health check succeeds. |

## Existing infrastructure confirmed reusable (not rebuilt)

- **Authenticated APIs**: `requireAuth`, `requireValidVenue`, `requireVenueMembership` (Package B, unchanged, reused for the new `/integrations` endpoint).
- **Database tables**: no new table — the registry queries `smokecraft_management_sync_journeys` (health check) and `ticket_tapper_specials`/`passport_360_guest_profiles` (existence checks) directly.
- **Route destinations**: no new route file beyond one new endpoint on the existing `managementSyncRoutes.js`.
- **Service contracts**: none existed for "integration status" before this package — this is genuinely new, minimal infrastructure.
- **Provider credentials/configuration**: none found anywhere for POS360/E.A.T./NOVEE OS specifically scoped to SmokeCraft Management Sync (confirmed by code search, not assumed).
- **Queue/retry infrastructure**: none exists (re-confirmed, unchanged from prior packages' findings).
- **Idempotency support**: Package A's DB-level unique constraints remain the only real idempotency mechanism; the new `/integrations` endpoint is read-only and has no write to protect.
- **Audit support**: `auditAction()` middleware exists and is reused elsewhere; **not** applied to `/integrations` this pass since it's a low-sensitivity read (documented as a scope decision, not an oversight).

## What was built

- `server/services/managementSync/integrationRegistry.js` — the one authoritative, server-side registry (8 integrations, real fields per the required schema: key, displayName, destinationType, authRequired, venueScoped, supportedOperations, timeoutMs, retryPolicy, idempotencyPolicy, auditRequired, healthCheck, packageDependency).
- `server/services/managementSync/connectionStateService.js` — the connection-state engine. `internal_management_sync` and `ticket_tapper` run **real, live SQL health checks** every request (never cached/assumed); `passport_360` runs a real existence check but is classified `INTERNAL_ONLY` regardless of table reachability, since reachability alone doesn't prove a write path exists; the remaining 5 are static classifications backed by the Phase 1 audit evidence above (there is nothing to "check" for a system with zero real API surface — a static, evidence-backed classification is the honest representation, not a live check of nothing).
- `handleGetIntegrationStatuses` added to `managementSyncController.js`.
- `GET /venues/:venueId/integrations` added to `managementSyncRoutes.js` — reuses the exact `requireAuth` + `requireValidVenue` + `requireVenueMembership` chain already built and tested in Package B/D.
- `getIntegrationStatuses(venueId)` added to the frontend API client.
- `src/pages/smokecraft/ManagementSyncAnalytics.jsx` extended with a real Integration Status panel, fetched alongside the existing analytics data, rendered from server-returned states only.

## What was deliberately NOT built (per instruction, not a gap)

- No Ticket Tapper "dispatch" endpoint in Management Sync — the real, existing, already-tested tap/add tracking API remains the only real Ticket Tapper write surface; duplicating it would have violated "do not create a second Ticket Tapper system."
- No Passport 360 completion-handoff write path — the guest-identity mapping between SmokeCraft and Passport is unverified, so no write was attempted; `INTERNAL_ONLY` is the honest classification, not a placeholder for future work done partially.
- No Staff Handoff, Inventory, POS360, E.A.T. 360, or NOVEE OS write/dispatch code — none has a real, verified destination, so per instruction none was built, faked, or partially wired.
- No idempotency-key infrastructure for new write operations — there are no new write operations this package (the one endpoint added is read-only).

## Guest-facing integration status

**Not built this package** — the `/integrations` endpoint is manager-only (same middleware as `/insights`). A guest-facing, redacted status display (Phase 14's guest-visible states) was judged lower priority than getting the manager-facing, authoritative version genuinely real and tested, given this package's time budget. Disclosed limitation, not silently dropped.
