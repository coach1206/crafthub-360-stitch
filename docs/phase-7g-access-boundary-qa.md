# Phase 7G — Guest / Staff / Admin Access Boundary QA

All findings below are from direct grep against the repo, not assumption.

## SyncStatusPanel

```
grep -rl "SyncStatusPanel" src/ --include="*.jsx" --include="*.js"
```
Results: `src/components/pos3/integrations/POSSyncStatusPanel.jsx` (definition), `src/components/staff/SyncStatusPanel.jsx` (definition), `src/pages/pos3/POSIntegrationHub.jsx` (consumer — under `/pos3/integrations`, gated by `access_pos3_staff`), `src/pages/eat/EATCommandHub.jsx` (consumer — under `/eat`, gated by `access_eat_command`).
**Result: PASS.** Both consumers sit behind staff/manager `ProtectedRoute` gates. No guest route imports this component.

## SyncConflictReviewPanel

```
grep -rl "SyncConflictReviewPanel" src/ --include="*.jsx" --include="*.js"
```
Results: `src/components/staff/SyncConflictReviewPanel.jsx` (definition), `src/pages/eat/EATCommandHub.jsx` (consumer, manager-gated).
**Result: PASS.**

## SyncAuditTimelinePanel

```
grep -rl "SyncAuditTimelinePanel" src/ --include="*.jsx" --include="*.js"
```
Results: `src/components/staff/SyncAuditTimelinePanel.jsx` (definition), `src/pages/eat/EATCommandHub.jsx` (consumer, manager-gated).
**Result: PASS.**

## E.A.T. command tools on guest screens

Checked `src/pages/DayOneTravel.jsx`, `src/pages/SmokeCraft.jsx`, `src/pages/passport/*.jsx` for any import of `eat/`, `pos3/`, or `staff/` components. None found.
**Result: PASS.**

## POS manager-only controls on guest screens

Same check — no guest screen imports any `pos3/*` component or service beyond what DayOneTravel/SmokeCraft/Passport already legitimately use (none do).
**Result: PASS.**

## Manager/admin routes remain protected

From `src/App.jsx`: `/admin`, `/founder`, `/novee-home`, `/ultra-command-center`, `/novee-vault`, `/remote-software-control`, `/venue-mirror`, `/system-overview`, `/kiosk-setup`, `/install-help`, `/venue-test`, `/founder-demo`, `/investor-demo`, `/pilot-onboarding`, `/device-status` are all wrapped in `ProtectedRoute` with `allowedRoles` or `requiredPermission`, all `demoBlocked` (except `/venue-demo` which explicitly sets `demoBlocked={false}` — a deliberate, pre-existing exception for the venue-owner demo flow, not a Phase 7 regression).
**Result: PASS — unchanged from pre-Phase-7G state.**

## E.A.T. remains permission gated

`grep -n "access_eat_command" src/App.jsx` → two hits, both wrapping the `eat-legacy` route and the `eat` parent route (whose children, including `EATCommandHub`, inherit the gate via the shared `<Outlet/>`).
**Result: PASS.**

## POS staff routes remain permission gated

`grep -n "access_pos3_staff" src/App.jsx` → three hits, wrapping `/pos`, `/pos/table/:tableId`, and the `/pos3` parent route (whose children, including `/pos3/handheld`, inherit the gate).
**Result: PASS.**

## DayOne360 remains guest-safe

`src/pages/DayOneTravel.jsx` is mounted at `/dayone360-travel` and `/dayone360` with no `ProtectedRoute` wrapper (consistent with its guest/client audience). It imports only `craftImages`, `TicketTicker`, the new `travelApi.js`, and `passportService.createPassportId` — no staff/admin/sync components.
**Result: PASS.**

## Passport remains guest-safe

All `/passport/*` routes are unwrapped (no `ProtectedRoute`), consistent with "guest-accessible + demo-allowed" comment in `App.jsx`. No Sync panels or staff tools imported by any `pages/passport/*.jsx` file.
**Result: PASS.**

## No raw JSON visible as main UI

Checked `DayOneTravel.jsx`, `POS3Handheld.jsx`, `EATCommandHub.jsx` — all render formatted UI (cards, pills, forms); no `JSON.stringify` output rendered to the page in any of the Phase 7-touched files.
**Result: PASS.**

## Overall boundary verdict

No regressions found. No permission logic was weakened in Phases 7A–7G. The only Phase 7G code change (POS3Handheld notification bell fix) did not touch any route or permission logic — purely a disabled-state visual fix.
