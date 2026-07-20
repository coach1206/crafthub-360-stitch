# SmokeCraft Management Sync — Response Contract & Access Control (Phases 6-7)

## Phase 6 — Response contract

Every endpoint in `SMOKECRAFT_MANAGEMENT_SYNC_API_CONTRACT.md` returns
this shape (wrapping the existing `wrap()` envelope pattern audited in
the backend architecture doc §8):

```json
{
  "success": true,
  "data": {
    "status": "ok | partial | unavailable",
    "scope": "journey | venue",
    "journey": { "...current journey values, real only..." },
    "sync": { "eventId": "...", "status": "pending|completed|failed", "destination": "..." },
    "summary": { "...4 already-real fields (cigar, pairing, xp, flavors)..." },
    "what_was_synced": { "...fields included in the last successful sync, or null..." },
    "management_insights": {
      "topPerformingPairing": { "value": null, "availability": "insufficient_data" },
      "mostSelectedCigar": { "value": null, "availability": "insufficient_data" },
      "guestSatisfaction": { "value": null, "availability": "not_collected" },
      "repeatVisitPotential": { "value": null, "availability": "insufficient_data" }
    },
    "venue_operations_impact": {
      "inventoryImpact": { "value": null, "availability": "integration_unavailable" },
      "staffPerformance": { "value": null, "availability": "not_collected" },
      "revenueImpact": { "value": null, "availability": "integration_unavailable" }
    },
    "actions": [ "...only real, permitted actions for this caller's role..." ],
    "availability": { "...per-field reason map, mirrors the nulls above..." },
    "warnings": [],
    "errors": []
  },
  "backendConnected": true,
  "persistenceMode": "live | local_fallback",
  "timestamp": "..."
}
```

**Availability reason vocabulary** (fixed set, matches the mandate):
`insufficient_data`, `not_collected`, `journey_incomplete`,
`integration_unavailable`, `inventory_not_linked`, `unauthorized`,
`offline`, `stale`.

**Hard rules**:
- No unavailable field is ever silently converted to `0` — `0` is only
  ever returned when it is the real computed value (e.g.
  `completed_journey_count: 0` for a genuinely new venue is valid; a
  metric that couldn't be computed returns `null` + an availability
  reason, never `0`).
- `journey` (current-journey values) and `management_insights`/
  `venue_operations_impact` (venue aggregates) are always separate
  top-level keys — never merged, so the frontend can never mistake one
  guest's data for a venue trend (directly enforces the mandate's
  "Do not present a single journey as a venue trend").
- `pending` values (a sync in flight) are distinguished from
  `unavailable` values via `sync.status`, not by omitting the field.

## Phase 7 — Access control model

| Role | May access | May not access |
|---|---|---|
| Guest | own `journey` summary, own `sync` status | venue-wide `management_insights`/`venue_operations_impact`, other guests' journeys, staff records, inventory analytics |
| Venue staff | data required for an authorized staff handoff only (once that feature exists — Package D, not built yet) | venue-wide financial/aggregate endpoints beyond their handoff scope |
| Venue manager | their venue's `management_insights`/`venue_operations_impact`, inventory impact, guest-experience aggregates, authorized staff feedback | another venue's data |
| Platform admin | per existing platform policy (not redefined here) | n/a |

**Required security rules — implementation mapping**:

| Rule | Enforced by |
|---|---|
| User A cannot read User B | journey-ownership check: `journey.user_id = req.user.id OR journey.guest_reference = req.guestReference` before returning any journey-scoped data |
| Venue A cannot read Venue B | `requireRole('venue_manager')` + server-side lookup of the caller's authorized `venue_id` set (from the existing venue-role tables, Phase 1 §16) — the path `:venueId` is checked against that set, never trusted alone |
| Guest cannot access venue aggregate endpoints | `requireRole('venue_manager')` on `GET .../venues/:venueId/insights` rejects any caller without that role, including guests, with 403 |
| Missing authentication returns 401 | `requireAuth` |
| Authenticated but unauthorized returns 403 | `requireRole`/`requirePermission` (roleMiddleware.js, existing) |
| Missing record returns 404 | explicit `if (!journey) return res.status(404)...` in the controller |
| No endpoint accepts client-supplied venue ownership without server validation | see Venue A/B rule above — path param is a lookup key, not a trust boundary |
| Guest feedback/notes must not leak into venue aggregates in identifiable form | `smokecraft_management_sync_snapshots.feedback_text` is never selected into any `venue_insights`/aggregate query — aggregates only ever `COUNT()` feedback presence, never `SELECT feedback_text` in a venue-scoped response |

**Middleware reused (no new middleware invented)**: `requireAuth`,
`optionalAuth`, `attachGuestContext` (authMiddleware.js);
`requireRole`, `requirePermission`, `auditAction` (roleMiddleware.js).
Ownership checks (journey/venue match) are new business logic inside the
Management Sync service layer, not new middleware — consistent with how
`ticketTapperPromotionController.js` derives `tenantId` inline rather
than via a dedicated middleware.

**Known gap carried forward, not fixed by this package**: guest identity
has no server-verifiable form today (Phase 1 §14). Until that's resolved,
"own journey" ownership for unauthenticated guests can only be enforced
via a server-issued opaque `guest_reference` token handed to the client
at journey-start and required on every Management Sync call — this token
design is a **Package A/B implementation decision**, not resolved here,
and is listed as a blocker in the validation document.

## Addendum — resolved this package

The guest-identity token design referenced above is now fully specified
in `SMOKECRAFT_MANAGEMENT_SYNC_GUEST_IDENTITY_DESIGN.md` (server-issued
JWT + HTTP-only cookie, reusing existing `verifyJwtToken`/cookie
infrastructure). Additionally, this package found that the venue-scope
enforcement described above (`requireRole('venue_manager')` +
server-side venue-set lookup) **does not exist anywhere in this codebase
today** — `requireRole`/`requirePermission` only check a global
`req.user.role` string, with no venue-membership query at all. See
`SMOKECRAFT_MANAGEMENT_SYNC_ROLE_MODEL_AUDIT.md` finding #13. Package B
must build this venue-ownership check as new logic; it cannot assume
`requireRole` alone provides venue isolation.

## Addendum — Package B implemented

The venue-ownership check described above is now built:
`requireVenueMembership`/`requireVenuePermission`/`requireJourneyOwnership`
in `server/services/managementSync/venueAuthorizationService.js`. See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_SECURITY_REPORT.md` for the full
as-built security report, including one real crash bug found and fixed
during testing (an unhandled rejection in this exact middleware family)
and the honest disclosure that cross-user/cross-venue denial was
verified structurally + via the platform-admin-bypass path rather than
via two fully-seeded distinct `venue_memberships` rows this pass.

## Addendum — cross-user/cross-venue denial now proven live (Package C)

The limitation above is closed: `verify-smokecraft-management-sync-package-b-proof-gaps.mjs`
seeds two real venues, two real `system_users`/`venue_memberships` rows,
and proves via live HTTP requests that neither user/venue can access the
other's data (6 endpoint checks for cross-user, 2 for cross-venue, all
denied; same-venue/same-user access confirmed to still succeed). See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_C_TEST_REPORT.md` Phase 2.

## Addendum — analytics endpoint reuses this exact authorization chain (Package D)

`GET /venues/:venueId/insights` uses `requireAuth` +
`requireValidVenue` + `requireVenueMembership` unchanged — no new
authorization code was written for analytics; it reuses what Package B
already built and Package C's proof-gap suite already proved correct.
Live-verified again this package with a real cross-venue denial against
real seeded `venue_memberships` rows. See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_PRIVACY_MODEL.md`.

## Addendum — integration status endpoint reuses this chain again (Package E)

`GET /venues/:venueId/integrations` uses the identical
`requireAuth`/`requireValidVenue`/`requireVenueMembership` chain — the
third endpoint to reuse it unchanged (after `/actions` and `/insights`).
See `SMOKECRAFT_MANAGEMENT_SYNC_INTEGRATION_SECURITY.md` for the one
disclosed gap this package (no `auditAction()` on this specific
read-only endpoint).
