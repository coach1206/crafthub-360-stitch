# Known Limitations — Final, Package 7

## Genuine external-activation gaps (not code defects)
- No live Cloudflare R2 / S3 bucket — media adapter code is real, unexercised against a live bucket.
- No live Stripe keys — payment adapter code is real, unexercised against live-mode charges.
- No live Sentry / uptime-monitor account.
- No public domain, no live Railway/cloud deployment, no reachable public URL.
- No real legal counsel review has occurred — every policy text remains labeled DRAFT — PENDING COUNSEL REVIEW.
- No real venue staff exist to complete the staff-acknowledgement flow with real data (mechanism exists and is verified with fixture data only).

## Scope limitations (documented, not blockers)
- Accessibility re-checks this pass were pragmatically scoped to 2-3 viewport groups on the relevant screens (legal/compliance, checkout, Venue Humidor, Golden Box, POS360, E.A.T. including the new sync-status UI), not a full 5-viewport sweep of every screen.
- The large majority of domain-specific `verify:*` validators in `package.json` (60+, covering POS360 sub-areas, NOVEE OS, tax, etc.) were not individually re-executed this pass; nothing in this package touches that code, and POS360's own aggregate 339/339 production-readiness suite was re-run and passed.
- Live POS360 <-> E.A.T. order/handoff bridge remains out of this package's scope (the existing E.A.T. sync fixed here covers session-completion/guest-activity/manager-alert/inventory-signal/audit sync, not a live POS360 order bridge).

## Visual/UX items intentionally left unfixed (per mandate scope discipline)
- Bundle code-splitting warning (>500kB main chunk) — build-time optimization opportunity, not a functional defect.
- Any pre-existing, previously-documented minor visual polish items (mobile/tablet letterboxing edge cases, etc.) not reassessed as blocking anything material this pass touched.

None of the above are launch blockers in the STOP CONDITIONS sense — they
are all either external-activation-pending or explicitly out of scope by
mandate design.
