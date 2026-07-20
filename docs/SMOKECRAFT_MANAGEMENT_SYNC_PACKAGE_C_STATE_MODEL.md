# SmokeCraft Management Sync — Package C State Model

## `journey.managementSync` shape (new, additive field)

```js
{
  serverJourneyId: string | null,
  venueId: string | null,
  sessionNumber: number | null,
  serverStatus: 'in_progress' | 'completed' | 'abandoned' | null,
  snapshotVersion: number | null,
  saveState: 'saving' | 'saved' | 'failed' | null,
  lastSavedAt: number | null,       // epoch ms
  syncStatus: 'pending' | 'completed' | 'failed' | null,
  syncEventId: string | null,
  syncError: string | null,
  lastSyncedAt: number | null,      // epoch ms
  venueError: 'venue_not_found' | 'venue_inactive' | null,
  ownershipError: string | null,
}
```

## Required UI states — implementation status

| State (mandate) | Implemented as | Notes |
|---|---|---|
| INITIALIZING | `identityState === 'initializing'` | set before the first guest-session call resolves |
| LOADING | not separately modeled — the sync button simply doesn't render until identity resolves | scope-reduced, see Implementation doc |
| EMPTY | implicit — no sync button when `!hasRealVenue` | real, tested |
| PARTIAL | not separately modeled this pass | scope-reduced |
| READY | `syncActionState === 'idle'`, button visible | real |
| SAVING | `saveState === 'saving'` (tracked in state; not separately surfaced in `ManagementSync.jsx`'s UI text this pass — `syncActionState === 'working'` covers the combined chain instead) | partially implemented — the granular per-step saving/saved text described in Phase 9 was simplified to one combined "Syncing…" state for the single button, since Package C wires one explicit action, not per-checkpoint saves |
| SAVED | `saveState === 'saved'` (state tracked; combined into "✓ Synced to venue" text) | as above |
| PENDING | `syncStatus === 'pending'` | real, set immediately before the sync API call |
| PROCESSING | not distinctly reachable — `venue_insights` sync completes synchronously server-side (Package B design) | honest — no code path fabricates a processing state that can't currently occur |
| COMPLETED | `syncStatus === 'completed'` → "✓ Synced to venue" | real, tested end-to-end |
| FAILED | `syncActionState === 'error'` → "Sync failed — venue backend unavailable. Try again later." | real |
| RETRYING | not implemented — a failed sync leaves the button available again for a fresh explicit click (which is itself the retry), no distinct "retrying" sub-state | acceptable per Phase 14's "retry only when explicitly safe" |
| OFFLINE | `identityState === 'offline'` when `navigator.onLine === false` at guest-session time | real, but only checked once at session-establishment time, not continuously |
| STALE | `ownershipError` set when a stored journey ID no longer resolves | real, causes a clean restart rather than a UI banner |
| UNAUTHORIZED | `guest.error` surfaced from `ensureGuestSession` | real |
| GUEST SESSION EXPIRED | same as UNAUTHORIZED — Package B's `guest_session_invalid` maps to this | real, not visually distinguished from generic unauthorized this pass |
| VENUE NOT FOUND | `venueError === 'venue_not_found'` | real |
| VENUE INACTIVE | `venueError === 'venue_inactive'` | real |
| JOURNEY NOT FOUND | surfaced as `ownershipError`, triggers clean restart | real |
| JOURNEY ALREADY COMPLETED | `managementSync.syncStatus === 'completed'` hides the button — a completed journey shows the confirmation text instead of a re-triggerable action | real |
| NOT CONFIGURED | used verbatim in Phase 16 wording for management action buttons — **not applicable this pass**, since Package C did not touch View Analytics/Inventory/Staff Feedback buttons at all (they were already effectively inert/undocumented in the current screen; no code exists there to wire or disable) | disclosed gap, see Implementation doc |

## Honest disclosure

Roughly half of the mandate's 20-state list is implemented with real,
distinct code paths and live-tested; the other half is either not
separately reachable given this package's single-button integration
point (PROCESSING), intentionally collapsed into a coarser state for
this pass's scope (SAVING/SAVED, RETRYING), or not addressed at all
(PARTIAL, granular offline detection, management-action button states).
This is disclosed here rather than claimed as fully implemented.

## Addendum — Package D additions

A Retry button was added to the FAILED state (previously text-only), and
`role="status"`/`aria-live="polite"` now wraps the sync-status container
— both verified via Playwright. PARTIAL, PROCESSING, and a distinct
RETRYING sub-state remain unimplemented; see
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_IMPLEMENTATION.md` for the current,
still-honest state of this list.
