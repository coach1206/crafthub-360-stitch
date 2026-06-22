# Founder Handoff Checklist — Before Claiming SmokeCraft Is Production-Ready

SmokeCraft MVP2 is feature-complete as a prototype (see
`docs/smokecraft-mvp2-closeout.md`). It is **not** production-ready. Do not
tell investors, venues, or guests that SmokeCraft has live shared storage,
authenticated POS3 verification, real inventory sync, or payment processing
until every item below is independently verified — not just "looks done in
the code."

## Backend / data

- [ ] Apply `server/db/migrations/011_smokecraft_schema.sql` to a real
      Postgres database. This repo has no migration runner — it must be run
      manually (e.g. `psql $DATABASE_URL -f server/db/migrations/011_smokecraft_schema.sql`).
- [ ] Set `DATABASE_URL` in the actual deployment environment (not just
      local `.env`).
- [ ] Verify `storageMode` actually returns `"postgres"` from a live
      endpoint call after deployment — do not assume it does because the
      env var is set. Confirm with `curl <deployed-url>/api/smokecraft/purchase-intents`
      and check the `storageMode` field.

## Auth / security

- [ ] Add `requireAuth` / role middleware to
      `server/routes/smokecraftRoutes.js` and
      `server/routes/smokecraftEatRoutes.js` (compare the existing
      `requireAuth, canAccessEAT` pattern in `eatRoutes.js`).
- [ ] Add demo-mode backend write blocking, matching the existing
      `demoModeConfig.js` pattern already used by `pos3Routes`/
      `venueTestRoutes`.
- [ ] Protect POS3 verification endpoints
      (`/api/smokecraft/purchase-intents/:intentId/verify` and `/reject`)
      so only an authenticated POS3-staff session can call them — currently
      any caller can.
- [ ] Protect founder/admin audit routes
      (`GET /api/smokecraft/audit-events`) so only admin/founder roles can
      read them — currently any caller can.

## Inventory / payment

- [ ] Connect a real inventory service before treating
      `inventory-impact-preview` as anything other than a preview. Today it
      always returns `applied: false` by design — do not wire automatic
      deduction without a real inventory system behind it.
- [ ] Connect a real payment/POS provider before claiming SmokeCraft
      supports payment. Today, "purchase verification" is a manual staff
      attestation only — no payment transaction occurs anywhere in this
      flow.

## Assets

- [ ] Re-verify no premium SmokeCraft image is missing in the production
      build (Phase 11's audit found none missing as of `85e70fb7`, but
      re-check after any further asset changes).

## Verification after deployment

- [ ] Re-run the route audit against the deployed URL (all `/smokecraft/*`
      routes load, no dead CTAs).
- [ ] Re-verify mobile at 430px against the deployed build, not just local
      dev.
- [ ] Verify the POS3 handheld/tablet layout against an actual handheld
      device, not just a desktop browser resized — POS3's sidebar shell is
      not currently mobile-responsive (known gap, flagged in Phase 11).
- [ ] Verify the E.A.T. management layout against an actual tablet/desktop
      device used by E.A.T. staff.
- [ ] Verify no demo data (the "Demo Lounge Ranking" board, or any other
      labeled-demo content) is ever shown to a real guest as if it were
      live shared data — confirm the DEMO badge and labeling survive in
      the production build.
