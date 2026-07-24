# 07 — Journey-State Authority Audit

## The two client-side stores (re-confirmed architecture, unchanged since the Clean-Start pass)

| Value | Canonical authority | Storage key | Journey-scoped? | Cleared by Start New? |
|---|---|---|---|---|
| Learner name/email/profile | `GuestSessionContext` | `novee_guest_session` (localStorage) | Yes (`resetJourneySpecificFields()`) | Yes |
| Selected cigar/mentor/level | `GuestSessionContext` | same | Yes | Yes |
| `completedSteps` (curriculum progress) | `GuestSessionContext` | same | Yes | Yes (reset to `['enroll']`) |
| Selected venue | `SmokeCraftJourneyContext` | `sc_journey_v1` (localStorage) | Yes | Yes (`startNewJourney()`) |
| `activeJourneyId` | `SmokeCraftJourneyContext` | same | Yes (mints a new one) | Yes |
| `previousCompletedJourneys` (archive) | `SmokeCraftJourneyContext` | same | No — this IS the archive | Never read back into active state (confirmed) |
| Golden Box / Packaging Studio draft & submission | Server (Postgres) via `goldenBoxRoutes.js`/`packagingStudioRoutes.js` | server DB | Yes, keyed by guest/journey id | Server-side, not touched by client-side Start New (out of this pass's scope to re-verify; unchanged from the Golden Box passes' own regression coverage, 70-74/74 baseline) |
| Passport stamps/XP/badges | `GuestSessionContext.passport` | `novee_guest_session` | **No — explicitly account-level, preserved across journeys by design** (documented decision from the Clean-Start pass) | Not cleared (intentional) |

## Read/write/hydration order (re-verified this pass by source read)

- Both contexts hydrate synchronously from `localStorage.getItem(...)` inside `useState(() => ...)` initializers (`GuestSessionContext.jsx` line ~240, `SmokeCraftJourneyContext.jsx`) — i.e., the very first render already has the persisted state, not a flash-then-hydrate pattern. No separate async hydration effect was found that could race with the first paint.
- Both contexts write back to `localStorage` via a `useEffect` keyed on their own state (`GuestSessionContext.jsx` line 290) — a normal React persist-on-change pattern, not a debounced/batched write that could lose a rapid double action (consistent with the "double-click safety" behavior already verified live in the Start New Journey pass).
- **No conflict-resolution logic exists between the two contexts** because none is needed by design — they store disjoint fields (guest profile/progress vs. venue/journey-archive), and the one place they must move together (Start New) is handled by a single hook, `useStartNewSmokeCraftJourney()`, that calls both contexts' reset functions in the same synchronous handler.

## Whether stale state can win

- **Completed/archived history winning over active state:** ruled out — `previousCompletedJourneys` has zero read-back consumers (re-confirmed by grep this pass).
- **A new journey failing to clear old fields:** this WAS the original root cause of the "Greg Guy / Romeo y Julieta 1875 / Carlos Mendoza / 63%" defect (fixed in the Clean-Start pass, root cause: two uncoordinated stores, only one was ever reset) — re-confirmed still fixed this pass (both contexts' reset functions are still called together by the one canonical hook, unchanged since).
- **Server-side Golden Box/Packaging Studio state surviving a client-side Start New:** **not re-verified in this pass** — flagged as a genuine open question, since the client-side reset never calls a server-side "archive this guest's Golden Box draft" endpoint as far as this pass's source read could confirm. This is a **suspected-but-unproven** gap, listed in `12-ROOT-CAUSE-FINDINGS.md`, not silently assumed fine.

## Storage authorities enumerated (per the mandate's checklist)

- **LocalStorage:** the only persistence layer for `GuestSessionContext`/`SmokeCraftJourneyContext` (confirmed).
- **SessionStorage:** used only for `DemoModeContext` and boot-state flags (`novee_booted`) — confirmed not used for journey/session data.
- **IndexedDB:** no usage found anywhere in `src/context/` or `src/pages/smokecraft/` (grep returned zero matches) — not a factor.
- **Cookies:** not used for guest session state (confirmed by grep of `document.cookie` in the SmokeCraft subtree — zero matches; `cookie-parser` in `server/index.js` is for authenticated-staff sessions, a separate system, out of scope).
- **Route state / query parameters:** confirmed (prior Entry-Prerequisite pass) not trusted for any prerequisite check — the guard only reads real `completedSteps`/`selectedVenue`.
- **Server APIs:** the guest-session-to-Postgres link exists for Golden Box/Packaging Studio/Passport only, not for the base curriculum `completedSteps` array (which is 100% client-local) — this is an intentional, previously-documented architecture (offline-tolerant curriculum progress), not a newly-found gap.
