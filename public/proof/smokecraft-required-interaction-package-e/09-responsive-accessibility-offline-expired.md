# 09 — Responsive / Accessibility / Offline / Session-Expired Proof

## Responsive (5 viewports)

Browser suite sweeps 1440×900, 1180×820, 1024×768, 768×1024, 390×844 — `document.documentElement.scrollWidth <= window.innerWidth + 2` holds at every size (no horizontal cutoff).

## Keyboard navigation

The claim button is a real `<button>` — `.focus()` succeeds (`document.activeElement.getAttribute('aria-label') === 'Claim Your Stamp'`), and `Enter` on the focused button triggers the same real claim flow as a mouse click (verified via a real server round-trip, not a simulated state change).

## Offline state

With the browser context set fully offline (`context.setOffline(true)`), a claim attempt fails gracefully — no crash, the page remains on `/smokecraft/passport-stamp`, and no fabricated local "success" state is shown.

## Session-expired state

With cookies cleared mid-session, a claim attempt is honestly denied (`401` or `422` — either a rejected request or an auto-issued fresh, zero-progress identity that is correctly never eligible) — never silently succeeds.
