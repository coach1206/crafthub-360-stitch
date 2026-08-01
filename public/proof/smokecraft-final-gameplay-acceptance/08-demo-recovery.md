# 08 — Demo Recovery

Real, tested recovery paths for a live investor demo, derived from what
was actually exercised (or deliberately probed) during this pass.

## If a screen fails to render mid-demo

Every screen in the representative set has a real, working **Back**
control (confirmed clickable in all 82 acceptance assertions). Use it,
then re-navigate via the sidebar/nav rather than the browser back button
(the app owns its own navigation state).

## If the demo player's progress looks wrong or stuck

Visit `/smokecraft/demo-reset` and click **Reset & Start Demo**. This is
device-local only (localStorage/sessionStorage) — it does not touch the
backend database, the demo player's own server-side XP/completion record,
or any other guest's data. A fresh guest identity is auto-issued to the
browser on next contact with the API, exactly like any new visitor.

## If Golden Box judging/award state isn't ready live

Judging requires a distinct staff/admin role (a player cannot judge their
own entry — `judge_self_assignment_prohibited`, re-confirmed real in this
pass's own regression run). If a live judge isn't available, show the
pre-captured Results screenshot (`screenshots/desktop/13-golden-box-results.png`)
and narrate the flow instead of live-judging on stage.

## If the backend or preview server is unreachable

- Backend: `node server/index.js` (port 3001). Health check:
  `GET /api/health`.
- Frontend (production build): `npm run build && npx vite preview --port 5050`.
- Both must be reachable before starting `/smokecraft/demo`.

## If rate-limiting (429) reappears

Confirmed fixed for dev/test in this pass (SC-D068b,
`server/routes/goldenBoxContentRoutes.js`). If it reappears, confirm
`NODE_ENV` is not accidentally set to `production` on the demo machine —
production correctly keeps rate limiting active by design.
