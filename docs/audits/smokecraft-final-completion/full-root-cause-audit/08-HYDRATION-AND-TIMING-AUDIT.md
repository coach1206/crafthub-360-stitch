# 08 — Hydration and Timing Audit

## Timelines (derived from source read this pass)

**Initial page load:** `GuestSessionContext`/`SmokeCraftJourneyContext` synchronously read `localStorage` in their `useState` initializers → first render already reflects persisted state → `SmokeCraftSessionGuard` reads that same state on its first render (no separate async fetch blocking it) → guard renders either the locked screen or real content immediately. **No flash-of-wrong-content window was found** for the client-local curriculum path.

**Start Journey / Start New Journey:** `useStartNewSmokeCraftJourney()` runs both context resets synchronously in one handler, then returns a route string that the caller `navigate()`s to — the reset therefore always completes (both localStorage writes done) *before* navigation fires, since it's the same synchronous call stack, not a fire-and-forget async write. A `useRef` lock prevents a second concurrent invocation (re-confirmed still present, `useStartNewSmokeCraftJourney.js`).

**Resume:** pure read of already-hydrated state (`computeJourneyStatus`) — no timing risk.

**Refresh:** same as initial page load — synchronous hydration, no risk found.

**Direct deep link:** `SmokeCraftSessionGuard` computes `unlocked`/`entryBlocked` on the same first render as the hydrated state — the `requires`/`entryBlocked` branches return `null` (not a flash of the real screen) while their `useEffect`-deferred `navigate()` runs; the `sessionNumber`-only lock path renders `LockedSmokeCraftScreen` directly, no redirect, no flash (re-confirmed by source read, `SmokeCraftSessionGuard.jsx`, and re-confirmed live in the prior Session-Sequence pass's route sweep).

**Deployment update (this is the one timeline this session cannot draw with confidence):** whether a live user's browser could be serving a cached older JS bundle after a Railway redeploy depends on Railway's cache headers and the browser's own cache — **unverifiable from this session** (no access to response headers from the live origin). This is flagged as a plausible contributor to "repo says fixed, user still sees old behavior" reports, alongside the deployment-commit uncertainty in `01-DEPLOYMENT-AUDIT.md`.

## Specific risks checked

| Risk | Found? |
|---|---|
| Context initializes before canonical storage | No — synchronous init |
| LocalStorage loads before server state | N/A for curriculum path (no server dependency); Golden Box/Passport server calls are explicitly async and not blocking on the base guard (unchanged, prior passes) |
| UI renders before reconciliation | No |
| Old state flashes before redirect | No (guard returns `null` during the `requires`/`entryBlocked` redirect window; `sessionNumber` lock renders the lock screen directly with no redirect at all) |
| Async journey creation routes before persistence completes | No — reset-then-navigate is synchronous |
| Route guard executes before context hydration | No — same render pass |
| StrictMode double-init | Not applicable in production builds (`React.StrictMode`'s double-invoke behavior is dev-only) |
| Double-click / retry creating duplicate journeys | No — `useRef` lock + dialog unmounts on confirm (re-verified live in the Start New Journey pass) |
| Service worker pinning stale JS/assets | **Major finding.** `src/main.jsx` (lines 29–33) contains code, already present before this pass, that proactively unregisters *every* service worker on every page load: `if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())) }`, with the comment "*TEMP: unregister any existing service workers so stale cached frontend assets are dropped while we verify the latest build is actually serving live.*" This proves a **prior, undocumented effort already identified service-worker/stale-asset caching as a suspected root cause** of exactly this operation's recurring "repo correct, live still wrong" symptom, and shipped a mitigation for it — one this audit's own documentation trail never referenced until now. The mitigation appears sound (unconditional unregister, no scoping bug found) but its own comment ("TEMP... while we verify") signals it was meant to be a temporary diagnostic, not a permanent fix, and was apparently never revisited or removed once the underlying question was answered. See `12-ROOT-CAUSE-FINDINGS.md`. |

## Conclusion

No timing/race defect was found in the client-side reconciliation logic itself. The one unresolved, disclosed risk is the service worker's caching behavior across deployments, which this session could not fully audit (would require inspecting the actual service-worker registration/cache-invalidation strategy against a live deployment cycle, which requires the very network access this session lacks).
