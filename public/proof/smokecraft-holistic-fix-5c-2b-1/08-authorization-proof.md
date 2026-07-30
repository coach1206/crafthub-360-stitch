# Authorization Proof — Holistic Fix 5C-2B-1

Verified live against the real running server.

- `POST /competitions/:id/results/finalize` requires `requireAuth +
  requireRole('admin')` at the route level (`goldenBoxRoutes.js`). A
  real authenticated non-admin (`staff-demo-001`, role `staff`)
  request was rejected with `403`.
- `GET /competitions/:id/results` returns different, real data by
  caller role: an admin sees the live pending/ready-to-finalize
  computation (until a finalization exists) or the immutable finalized
  record (once one does); a non-admin sees only the published
  finalized record, or an honest `not_finalized` status with no
  per-entry pending detail — never the pre-finalization eligibility/
  score data that would leak blind-judging-protected state.
- Verified live in the browser: a non-admin viewer (`staff-demo-001`)
  never sees a "Finalize Results" control on the Results screen, and
  only sees the real published ranking once it exists.
