# Test Evidence — Package 1

## Environment

Disposable local PostgreSQL 16 (`crafthub_pkg1_probe`), all 76
migrations applied via the real `npm run db:migrate` runner (confirmed
idempotent — a second run reports 76 skipped), real Express server on
port 3001, dev-mode header auth (`x-novee-user-role`/`x-novee-user-id`)
for administrator/judge identities, real guest-session JWT issuance for
entrant identities. Torn down at the end (database dropped, server and
Postgres stopped, `dist/` removed).

## `verify-golden-box-package-1.mjs` — 36/36 passed (final clean run)

Covers: migration integrity, competition creation across all 5 scopes,
venue-scope validation, open-entry eligibility (zero rules configured),
entry/draft creation and resume (no duplicates), entry versioning with
real persisted blend components, submission with real completeness
validation, rejection of edits after lock, rejection of duplicate
submission, **recipe privacy** (unrelated entrant denied, owner and
assigned judge allowed, unauthorized staff denied), human scorecard
submission with real category/range validation, score aggregation from
real submitted scores, AI-analysis honest `not_configured` status with
structural separation from official scores (verified by a real SQL
query proving zero AI-scorer rows in `golden_box_scores`), competition
lifecycle transition validity/invalidity, XP award via the normalized
ledger, XP idempotency (duplicate award proven skipped, balance
unchanged), leaderboard integration into the *existing*
`smoke_leaderboard_entries` table (row-count delta proven, not a new
table), honest badge-integration failure without a real guest profile
(no fabricated grant), `GOLDEN_BOX` audit-category rows + Golden Box
activity log rows created, Venue Management tables unaffected, full test
data removal.

## Real bugs found and fixed this package

1. **Cross-guest recipe leak**: `visibilityService.resolveViewerRole`
   compared `identity.userId === entry.user_id` — both `null` for two
   *different* guests, so `null === null` incorrectly granted `entrant`
   access to any other guest's private recipe. Found by check #11,
   fixed with explicit truthy guards (`ownsAsUser`/`ownsAsGuest`).
2. **Entry submission unreachable**: `ENTRY_TRANSITIONS` only allowed
   `submitted` from the `eligible` state, but nothing in the built flow
   transitions an entry to `eligible` automatically — every submission
   attempt failed with `invalid_transition_from_draft_to_submitted`.
   Fixed by allowing `draft`/`incomplete → submitted` directly, with
   `entryService.submitEntry`'s own component-completeness check as the
   real gate (documented design choice, not a workaround).
3. Two test-script bugs (not application bugs): a 1x1 fixture-style
   guest-reference read that assumed a response field the guest-session
   endpoint never exposes (fixed by decoding the JWT locally instead),
   and a cleanup-ordering bug that tried to null out a venue-scoped
   competition's `scope_venue_id` via `ON DELETE SET NULL` before
   deleting the competition row itself, violating
   `chk_gbc_scope_venue` (fixed by deleting competitions before venues).

## Regression suites re-run this package

| Suite | Result |
|---|---|
| `npm run build` | PASS |
| `verify-smokecraft-management-sync-package-a.mjs` | 16/16 passed |
| `verify-venue-management-command-hub-package-6b.mjs` | 33/33 passed |
| `verify-smokecraft-management-sync-package-b.mjs` | Not confirmed clean this pass — see limitation below |

### Disclosed limitation: Package B/E full regression not reconfirmed

Package B's suite references two venue fixtures
(`pkg-b-venue-active`/`pkg-b-venue-inactive`) it never seeds itself — a
**pre-existing gap in that test script**, already documented in
`VENUE_MANAGEMENT_COMMAND_HUB_PACKAGE_6B_TEST_REPORT.md` from the prior
package, not something Package 1 introduced. After manually seeding
those fixtures, subsequent runs were exhausted by this session's shared
in-memory rate limiter before a clean pass completed within this
package's time budget. Package A (16/16) and Venue Management 6B
(33/33) — both re-run cleanly on the first attempt against this same
server — provide direct evidence that Package 1's changes did not
regress unrelated systems; Package B/E are recommended for a dedicated
clean re-run (fresh server, no interleaved debug calls) before Package 2
begins, but are not re-asserted as passing here without that evidence.

## Cleanup

Test database dropped; Express server and local PostgreSQL 16 cluster
stopped; `dist/` and temp files removed.
