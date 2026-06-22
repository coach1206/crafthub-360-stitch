/**
 * SmokeCraft MVP2 Status — Phase 12 closeout.
 * Static, hand-maintained status flags for the SmokeCraft proof-of-concept.
 * These are NOT auto-detected at runtime (the frontend has no way to know
 * server DATABASE_URL state at build time) — they reflect the status
 * documented in docs/smokecraft-mvp2-closeout.md as of this commit. Update
 * this file by hand if that document's findings change; do not let it
 * silently drift from the real backend state. For live storage-mode truth,
 * use smokeSharedStorageService.getSmokeSharedStorageMode() instead — this
 * file is informational/display-only, never authoritative for behavior.
 */

export const smokecraftMVP2Status = {
  mvpStatus: 'MVP2_COMPLETE_WITH_PENDING_PRODUCTION_ITEMS',
  activeVertical: 'SmokeCraft',
  persistentBackend: false,
  memoryFallback: true,
  authRolesPending: true,
  demoModeBackendGatingPending: true,
  inventorySyncPending: true,
  paymentProcessingPending: true,
  otherCraftHubsStatus: 'COMING_SOON',
}

export default smokecraftMVP2Status
