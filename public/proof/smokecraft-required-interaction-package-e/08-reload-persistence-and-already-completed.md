# 08 — Reload Persistence / Already-Completed Behavior

## Reload persistence

- API test 13: fresh `GET /player-state` and `GET /status/:anything` (same identity cookie, simulating a reload) after a real claim → completion and stamp both persist (server-authoritative Postgres rows, not localStorage-only).
- Browser test: a real, full `page.goto()` reload after claiming → `status.claimed === true`; the "Claim Your Stamp" button correctly does not reappear for an already-claimed guest.

## Already-completed behavior

- API test 14: `GET /eligibility` for an already-claimed guest → `alreadyClaimed: true`, `eligible: false` (cannot re-claim even though the 6 prerequisite sessions remain in the completed set).
