# Venue Management Command Hub — Architecture

## Package 6A (schema foundation)
Migration 075: `venue_management_content_versions` (generic lifecycle/
version-history, shared across entity types), `venue_management_media`
(media metadata), `novee_os_remote_venue_actions` (NOVEE OS remote-op
ledger, append-only via trigger, foundation for a later package).
`server/services/venueManagement/venueManagementRoles.js` defines the
permission-key/role constants Package 6B and later packages consume.

## Package 6B (Venue Profile + Media vertical slice)
Migration 076: `venue_management_profiles`. New services:
`storageAdapter.js` (local-dev media storage, swappable), `imageValidation.js`
(manual MIME/dimension validation), `mediaService.js`, `venueProfileService.js`,
`brandingService.js`. New controller `venueManagementController.js`, new
routes `venueManagementRoutes.js` mounted at `/api/venue-management`.
Frontend: `src/pages/venueManagement/VenueManagementCommandHub.jsx` at
`/venue-management`.

All authorization reuses the exact `requireAuth` /
`requireValidVenue('venueId')` / `requireVenueMembership()` /
`requireVenuePermission(key)` / `auditAction('VENUE', action, 'post')`
chain built in SmokeCraft Management Sync Packages B-E — no parallel
authorization system was created.

See `VENUE_MANAGEMENT_COMMAND_HUB_PACKAGE_6B_IMPLEMENTATION.md` for the
full Phase 1 storage/upload audit and as-built detail.
