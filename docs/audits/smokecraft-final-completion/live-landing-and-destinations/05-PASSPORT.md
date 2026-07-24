# 05 — Passport / Locked Screens

**Defect:** `LockedSmokeCraftScreen.jsx` rendered baked lock IMAGES (`/smokecraft-future-visit-locked.png`, `/smokecraft-passport-stamp-locked.png`, `/smokecraft-connections-locked.png`, `/smokecraft-management-sync-locked.png`) with black-box overlays hiding stale baked "VISIT 5 OF 8 / SESSION 18 OF 24" text — the reported FUTURE VISIT LOCKED / MANAGEMENT SYNC LOCKED artwork. Reachable in production for a partially-progressed user (entry complete, session not yet unlocked).

**Fix:** replaced the image-based screen with a LIVE state panel composed from the authoritative 6-phase/27-session progress data:
- Real prerequisite (`getLockedReason`), live phase marker (`getVisitBySession` + `TOTAL_VISITS`), live current-progress ("Next up: <currentAllowed.label>"), and the correct return route (`currentAllowed.route`).
- No static lock artwork; all old lock-PNG references removed from source (grep-confirmed: only doc comments remain).

Landing Passport bottom-bar card still routes to `/smokecraft/passport-stamp`; the stamp screen shows for eligible users, the live panel for not-yet-unlocked users, and the entry guard redirects fresh users to enroll.
