# Technical Handoff — CraftHub 360 / SmokeCraft / NOVEE OS

Audit date: 2026-06-22.

## Branch Status

- Working branch for this handoff pass: `main` (docs-only commit, no app
  code changed).
- No open feature branches pending merge as of this audit.

## Latest Main Status

- Latest commit: `1662de3d — Merge pull request #3 from
  coach1206/claude/mentor-flag-badges`.
- Working tree: clean.
- `npm run build`: passes.

## Build Command

```
npm run build
```

Expected output: a successful Vite build with one pre-existing, non-blocking
warning — `index-*.js` exceeds the 500 kB chunk-size guideline. No build
errors are expected. (A dynamic-vs-static import warning for
`passportScanApi.js` also appears; it is informational only and does not
fail the build.)

## Known Warnings

- Chunk size warning: `dist/assets/index-*.js` is ~1.57 MB minified
  (~375 kB gzip), above Vite's 500 kB guideline. Not a build failure;
  addressable later via `manualChunks` / route-level code-splitting.
- Dynamic import warning: `src/api/passportScanApi.js` is both statically
  and dynamically imported by `PassportHome.jsx`, so Vite keeps it in the
  main chunk rather than splitting it out. Informational only.

## Key Routes

Defined in `src/App.jsx`. Selected highlights:

- `/crafthub` — CraftHub shell.
- `/smokecraft/*` — ~30 routes covering the full guest journey (enroll,
  mentor-selection, seed-soil, format, origins, curation, leaves,
  leaf-challenge*, cultivation, blend, flavor-dna, pairing, available,
  assistant, session-complete, terroir, vitola, identity, leaderboard,
  passport-stamp, humidor-match, cut-toast-light, first/second/final-third,
  scorecard, event-challenge, connections, management-sync, golden-box(/status)).
- `/passport/*` — profile, stamps, directory, connections, events, benefits,
  scan, how-it-works.
- `/pos3/*` — 10 sub-routes (handheld, tables, orders, checkout, kitchen,
  bar, humidor, inventory, integrations, settings) + index.
- `/eat/*` — 14 sub-routes (command-hub, pos-control, operations, inventory,
  reorders, staff, sections, kitchen, bar, humidor, data, reports,
  device-mode, media, settings).
- `/admin`, `/founder` — role-gated internal screens.
- `/pos`, `/eat-legacy` — legacy pages with real backend wiring (see
  Backend Pending Map below).
- Login routes: `/staff-login`, `/admin-login`, `/founder-login`,
  `/mentor-login`, `/dev-login`.
- Demo/internal tooling: `/demo`, `/ultra-command-center`, `/novee-vault`,
  `/remote-software-control`, `/venue-mirror`, `/mentor-console`,
  `/dev-diagnostics`, `/venue-test`, `/founder-demo`, `/investor-demo`,
  `/venue-demo`, `/pilot-onboarding`, `/system-overview`.

## Key Docs

- `docs/backend-readiness-map.md` — the authoritative, per-area audit of
  what is real vs. local-simulation vs. nonexistent. Read this first for
  any backend-wiring question.
- `docs/founder-handoff-checklist.md` — pre-production verification
  checklist (DB migrations, auth hardening, payment/inventory caveats).
- `docs/smokecraft-api-contract.md` / `docs/smokecraft-backend-schema.md` —
  SmokeCraft's real, implemented API and schema.
- `docs/smokecraft-mvp2-closeout.md` — SmokeCraft MVP2 feature-complete
  closeout notes.
- `docs/crafthub-mvp2-replication-blueprint.md` — how to replicate the
  SmokeCraft pattern for other CraftHub verticals.
- `docs/crafthub-coming-soon-policy.md` — policy for honest "Coming Soon"
  pages on unbuilt verticals (no fake data/scorecards).
- `docs/marketing-venue-handoff.md` — this handoff package's venue-facing
  overview, demo flow, and positioning.
- `docs/founder-demo-script.md` — this handoff package's spoken demo script.

## Backend Pending Map

Full detail in `docs/backend-readiness-map.md`. Summary:

| Area | Status |
|---|---|
| Auth (staff PIN/admin/founder) | Real, database-backed |
| Role/permission middleware | Real, server-enforced |
| SmokeCraft sessions/leaderboard/handoff | Real, with local-storage fallback |
| Passport ranking/badges | Real, authenticated API |
| Ticket Ticker | Real route, file-backed (not Postgres) |
| Demo session tracking | Real, isolated tables |
| POS3 third-party provider sync | Built, real — wired to legacy `/pos` only |
| POS3 (`/pos3/*`, 11 pages) | Local simulation (`localStorage`) |
| E.A.T. (`/eat/*`, 14 pages) | Local simulation (`localStorage`) |
| Passport Connections/Events | Simulated (`delay()` mocks, no real route) |
| Legacy leaderboard fallback | Local simulation |
| Events/Specials | Does not exist |
| Kiosk/device login sessions | Does not exist (design documented, not built) |

## Next Technical Tasks

1. Wire `/pos3/*` pages to existing/new backend tables (see
   `docs/backend-readiness-map.md` §4 for which tables already exist vs.
   need to be created).
2. Wire `/eat/*` pages similarly (staff/section assignment, reorder
   requests, inventory).
3. Design and implement `device_sessions` for kiosk/handheld login,
   scoped narrowly to kiosk routes (not a blanket bypass of `ProtectedRoute`).
4. Connect a real payment/POS processor before claiming payment support
   anywhere in the product.
5. Connect SMS/email provider for passport/media upload delivery links.
6. Add secure (non-local) storage for guest/passport media uploads.
7. Replace remaining cigar "Image pending" placeholders with final
   licensed photography.
8. Apply `server/db/migrations/011_smokecraft_schema.sql` (and any other
   pending migrations) to a real Postgres instance in the deployment
   environment, and set `DATABASE_URL` there — confirm `storageMode`
   actually reports `"postgres"` post-deploy, not just locally.
9. Production QA pass: full route audit and mobile layout check against the
   deployed build (not local dev).
