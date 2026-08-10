# SmokeCraft — `recovery/smokecraft-codex-final` → `main` Integration Plan

**Status: NOT merged. This is a plan, not an action taken.**

## 1. Divergence — the headline finding

```
git merge-base recovery/smokecraft-codex-final origin/main
```

returns **no common ancestor**. These two branches do not share git history —
`recovery/smokecraft-codex-final`'s root commit and `main`'s root commit are
different initial commits. This is not a normal feature-branch divergence
that `git merge`/`git rebase` can reconcile automatically; it is two
independently-evolved trees that happen to be hosted in the same repository
under the same product name.

Concretely:

| Signal | `main` | `recovery/smokecraft-codex-final` (HEAD `68d90e1d`) |
|---|---|---|
| Tracked files | 19,158 | 27,307 |
| Files containing "smokecraft" in path | 699 | 7,094 |
| `server/db/migrations/*.sql` | 13 (through `014_sync_audit_lifecycle.sql`) | 121 (through `121_pos360_smokecraft_identity_mapping.sql`) |
| `server/index.js` | 251 lines | 726 lines |
| POS360↔SmokeCraft bridge routes | absent | present (`pos360SmokeCraftOrderBridgeRoutes.js`, `eatSmokeCraftLiveSyncRoutes.js`, `pos360SmokeCraftIdentityMappingService.js`) |
| `package.json` dependencies | subset | superset (adds `@aws-sdk/client-s3`, `@dnd-kit/core`, `@dnd-kit/utilities`, `@stripe/stripe-js`, `express-rate-limit`, `helmet`, `sharp`, `stripe`) |

`main` already has its own, older, independently-built SmokeCraft
implementation (699 files) — this is not "main has no SmokeCraft and we're
adding it," it is "two different SmokeCraft implementations exist and must
be reconciled," which is a materially harder and higher-risk integration
than a greenfield merge.

**A blind `git merge origin/main` or `git merge recovery/smokecraft-codex-final`
in either direction would attempt to synthesize a merge across unrelated
histories (`--allow-unrelated-histories`), produce a diff touching nearly
every file in the repository, and cannot be conflict-resolved
mechanically — it requires deliberate, screen-by-screen and
table-by-table human review.** This is exactly the scenario this block's
mandate anticipated and forbade a blind merge for.

## 2. What SmokeCraft-specific work this branch actually contains

Traced from this multi-block recovery effort (Blocks 1 through 6A), the
substantive, verified-working SmokeCraft deliverables on this branch are:

- **Live-DOM SmokeCraft screens** (all 14 Block 6/6A-migrated screens plus
  the rest of the 27-session canonical spine) — real React components, no
  baked-mockup-as-interface anywhere, verified via `canonicalJourneyPass:
  true` (24/24 checkpoints, this block).
- **Real POS360 order-intent bridge** (`server/routes/
  pos360SmokeCraftOrderBridgeRoutes.js`, `server/services/pos360/
  pos360SmokeCraftOrderBridgeService.js`) — idempotent, DB-backed.
- **Real E.A.T. 360 live-sync bridge** (`server/routes/
  eatSmokeCraftLiveSyncRoutes.js`, `server/services/eat360/
  eatSmokeCraftLiveSyncService.js`) — idempotent, DB-backed.
- **Real SmokeCraft↔POS360 identity-mapping layer** (`server/services/
  pos360/pos360SmokeCraftIdentityMappingService.js`, migration 121) —
  governed, persisted, idempotent text-id-to-uuid resolution.
- **Real loyalty accrual hook** wired to a genuine commerce event
  (`order_fulfilled` staff action), through the identity-mapping layer,
  into the pre-existing `pos360_loyalty_*` ledger tables.
- **Management Sync journey lifecycle** (`server/services/managementSync/`)
  — real create/resume/snapshot/complete/sync, including the Block 5
  resume-dedup fix.
- **Ticket Tapper** (`server/controllers/
  smokecraftTicketTapperSpecialsController.js`) — real DB-backed
  create/publish/tap/add/report, schema-corrected in Block 4.
- **108 net-new database migrations** (`014` → `121`) spanning all of the
  above plus the wider NOVEE OS surface this branch also touched.
- **The unified Block 6A visual system** (`SmokeCraftHeroCrop.jsx` +
  9 new `SC_ASSETS` keys pointing at already-approved, pre-cropped
  photography).

## 3. What on this branch is genuinely unrelated to SmokeCraft

`git ls-tree` shows this branch's extra ~8,100 files are not all
SmokeCraft — they include unrelated NOVEE OS surface area (documentation
systems, ambient/device-pairing modules, onboarding/pilot/training
registries, payment-provider integrations, etc.) that accumulated on this
branch across its long recovery history. **Before any integration attempt,
these must be separated from the SmokeCraft-specific change set** — pulling
the whole branch across would import a large amount of code `main` never
asked for and cannot review in one pass.

A precise unrelated-vs-relevant file list requires a dedicated `git diff
--stat` pass scoped module-by-module (not attempted in this block — see
§5, "Not done this block") because computing it meaningfully first requires
resolving the unrelated-histories problem in §1 (a naive path-based diff
between unrelated trees is not trustworthy signal).

## 4. Conflicts with current `main`

Because there is no merge base, "conflicts" in the git sense (overlapping
hunks) cannot even be computed until a merge base is manufactured (e.g. via
`--allow-unrelated-histories` or a manual patch-apply). The conflicts that
matter here are **architectural**, not textual:

1. **Two SmokeCraft implementations at the same routes.** `main`'s existing
   699 smokecraft-path files presumably serve the same
   `/smokecraft/*` routes this branch's live-DOM screens serve. Importing
   this branch's versions naively would silently shadow or collide with
   whatever `main` currently ships.
2. **Migration numbering collision.** `main` stops at `014`; this branch
   has `015`–`121`. If `main` has *any* migrations of its own past `014`
   that this branch doesn't know about (not observed, but not ruled out
   without a dedicated check), a straight file-copy could number-collide
   or apply in the wrong order. The existing migration runner applies by
   filename order — file numbering must be re-sequenced or verified
   collision-free before copying.
3. **New backend dependencies.** `stripe`, `@stripe/stripe-js`, `sharp`,
   `@aws-sdk/client-s3`, `@dnd-kit/*`, `helmet`, `express-rate-limit` are
   not on `main` — if `main`'s own code doesn't already vendor equivalents,
   these need adding to `main`'s `package.json` and its own dependency
   review (helmet/rate-limiting in particular touch every request, not
   just SmokeCraft's).
4. **`server/index.js` divergence.** 251 vs 726 lines — this branch's
   server bootstrap mounts many more routers. Route-mounting order and
   middleware stacking would need manual reconciliation, not a file
   overwrite.

## 5. Safest integration strategy (recommended, not executed this block)

**Do not merge branches. Cherry-pick a reviewed, scoped patch set.**

1. **Freeze a SmokeCraft-only export.** From this branch, produce a
   standalone diff/patch limited to:
   - `src/pages/smokecraft/**`, `src/components/smokecraft/**`,
     `src/constants/smokecraft*.js`, `src/services/smokecraft/**`,
     `src/context/SmokeCraftJourneyContext.jsx`,
     `src/context/GuestSessionContext.jsx` (if SmokeCraft-specific),
     `src/hooks/useSmokeCraft*.js`
   - `server/routes/*smokecraft*`, `server/routes/*pos360SmokeCraft*`,
     `server/routes/*eatSmokeCraft*`, `server/controllers/*smokecraft*`,
     `server/services/managementSync/**`, `server/services/pos360/
     pos360SmokeCraft*`, `server/services/eat360/**`
   - `server/db/migrations/015_*` through `121_*` (renumbered to follow
     whatever `main`'s actual highest migration is, after a real check)
   - `public/assets/smokecraft/**`, `public/assets/smokecraft-reference/**`
   - The `docs/smokecraft/**` and `docs/visual-proof/**` evidence trail
     (optional — documentation only, zero runtime risk)
2. **Apply that patch set to a fresh branch cut from current `main`**, not
   the reverse. This keeps `main`'s own untouched history intact and makes
   the SmokeCraft addition auditable as one coherent, reviewable diff
   against a real base.
3. **Reconcile the two SmokeCraft implementations screen-by-screen.**
   For every route that exists in both, a human decision is required:
   keep `main`'s, replace with this branch's, or merge behavior. This
   cannot be automated safely.
4. **Add the new dependencies to `main`'s `package.json` deliberately**,
   with `helmet`/`express-rate-limit` reviewed for interaction with
   `main`'s existing middleware stack (these are process-wide, not
   SmokeCraft-scoped).
5. **Run every migration from `main`'s real current tail forward**, not
   assuming `014` is still accurate — confirm on the actual `main` branch
   at integration time, since this document's snapshot will age.
6. **Re-run this block's full verification suite** (canonical journey lock,
   5-viewport responsive, POS360/E.A.T./Management Sync/Ticket
   Tapper/loyalty regression, DB integrity audit) against the *integrated*
   `main`-based branch before considering it mergeable — passing on
   `recovery/smokecraft-codex-final` alone does not prove it passes once
   merged into `main`'s different surrounding code.

## 6. Required post-integration regression (once actually attempted)

- Full canonical journey lock (24/24 checkpoints)
- 5-viewport responsive check (0 failures)
- POS360/E.A.T. idempotency + identity-mapping loyalty accrual
- Management Sync resume/idempotency
- Ticket Tapper full lifecycle
- A fresh DB-integrity audit against `main`'s actual production/staging
  data shape (not this branch's test data)
- `main`'s own existing test suite (not run as part of this block — out of
  this branch's scope until integration is actually attempted)

## 7. Not done this block (explicitly out of scope per the mandate)

- No merge was performed or attempted.
- No patch set was actually extracted/applied.
- No file-by-file unrelated-vs-relevant classification was completed (§3) —
  this requires tooling beyond a single-block budget and is called out as
  the concrete next step, not silently skipped.
- No decision was made about which of the two SmokeCraft implementations
  "wins" per screen — that is a product decision for the owner, not an
  engineering default.

**Bottom line: this branch is safe to keep developing and verifying in
isolation (as this block did), but is not currently in a state that can be
merged into `main` by any automated or semi-automated git operation. A
successful integration requires the scoped-patch approach in §5, is a
separate, non-trivial project of its own, and should not be scheduled as an
incidental step of a future block.**
