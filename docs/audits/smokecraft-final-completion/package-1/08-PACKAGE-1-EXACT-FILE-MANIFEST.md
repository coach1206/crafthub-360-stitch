# Package 1 Exact File Manifest & Path-Count Reconciliation

## Step 1 — exact current git state (commands run, not estimated)

```
git branch --show-current      → recovery/smokecraft-codex-final
git rev-parse HEAD              → aa0b9cf86ff8cda0fb86651cfc88a142faea737f
git status --short | wc -l      → 166
Modified tracked (^ M)          → 46
Untracked (^??)                 → 120
Deleted                         → 0
Renamed                         → 0
Staged (git diff --cached)      → 0
git ls-files --others --exclude-standard | wc -l → 372 (individual files)
```

166 = 46 modified-tracked lines + 120 untracked lines. All 166 are
unstaged (nothing is in the index — `git diff --cached` is empty).

## Step 3 — reconciling 161 → 166 (5 new git-status lines, verified)

`git status --short` reports **one line per untracked top-level path**,
collapsing an entire untracked directory into a single `??` line
regardless of how many files it contains. `git ls-files --others`
reports **372 individual files** — the discrepancy between the two
counts (166 lines vs. 372 real files) is exactly this collapsing
behavior, confirmed by inspecting the 20 directory-form `??` lines in
the current status output, e.g. `?? server/services/goldenBox/`.

**Verified**: `server/services/goldenBox/` contains exactly 10 files
(`ls server/services/goldenBox/ | wc -l` → 10) — matching the "10 new
service files" in the Package 1 report — but appears as **one** line in
`git status --short`.

The 5 new git-status lines added by Package 1 (161 → 166), confirmed by
diffing the before/after `git status --short` output:

1. `?? server/services/goldenBox/` (new directory — contains all 10 service files)
2. `?? server/controllers/goldenBoxController.js`
3. `?? server/db/migrations/077_golden_box_foundation.sql`
4. `?? server/routes/goldenBoxRoutes.js`
5. `?? verify-golden-box-package-1.mjs`

Two categories of Package 1 file did **not** add a new line:
- `server/index.js` was already `M` (modified) before Package 1 (from
  Management Sync and Venue Management route mounts) — Package 1 added
  2 more diff lines to an already-modified file, not a new status line.
- `docs/audits/smokecraft-final-completion/package-1/*.md` (12 files)
  landed inside the already-untracked `docs/audits/` directory (created
  in Package 0), which was already collapsed to one `??` line before
  Package 1 began.

**Conclusion**: the count is correct and fully explained by git's
directory-collapsing display behavior — no file was hidden, ignored, or
omitted from tracking. Nothing was overwritten silently; every new file
is present and accounted for below.

## Step 2 — exact Package 1 file manifest

| Path | Git status | Existed before Pkg 1? | New/Modified | Type | Production code? | Protected system? | Safe to commit w/ Pkg 1? | Depends on other uncommitted file |
|---|---|---|---|---|---|---|---|---|
| `server/db/migrations/077_golden_box_foundation.sql` | `??` (new line) | No | New | SQL migration | Yes | No | Yes | Depends on `venues`, `audit_logs`, `smoke_leaderboard_entries` schemas from earlier migrations (all already committed-equivalent, applied) |
| `server/services/goldenBox/competitionService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077 |
| `server/services/goldenBox/eligibilityService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077, `xpService.js` |
| `server/services/goldenBox/entryService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077, `lifecycleService.js` |
| `server/services/goldenBox/judgingService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077, `lifecycleService.js` |
| `server/services/goldenBox/aiAnalysisService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077 |
| `server/services/goldenBox/visibilityService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077 |
| `server/services/goldenBox/rewardsIntegrationService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077, `xpService.js`, existing `passport_360_badges`/`smoke_leaderboard_entries` |
| `server/services/goldenBox/xpService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077 |
| `server/services/goldenBox/lifecycleService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077, `activityLogService.js` |
| `server/services/goldenBox/activityLogService.js` | inside `??` dir | No | New | JS service | Yes | No | Yes | Migration 077 |
| `server/controllers/goldenBoxController.js` | `??` (new line) | No | New | JS controller | Yes | No | Yes | All 10 goldenBox services |
| `server/routes/goldenBoxRoutes.js` | `??` (new line) | No | New | JS routes | Yes | No | Yes | Controller, existing `authMiddleware.js`/`roleMiddleware.js`/`smokecraftGuestIdentity.js` |
| `verify-golden-box-package-1.mjs` | `??` (new line) | No | New | Test script | No (test-only) | No | Yes | All Golden Box routes/services live |
| `server/index.js` | `M` (already modified pre-Pkg1) | Yes (already modified by Mgmt Sync/Venue Mgmt) | Modified (2 additive lines) | JS entrypoint | Yes | **Shared** — reviewed with care | Yes, review diff before commit | Golden Box routes file |
| `docs/audits/smokecraft-final-completion/package-1/*.md` (12 files: `00`–`07` from prior turn + `08`–`11` this turn + `12`) | inside `??` dir (`docs/audits/`) | Dir existed (Pkg 0), files new | New | Documentation | No | No | Yes | None |

No schema/utility/middleware/validator/config/package/lockfile file
outside the list above was touched — confirmed by `git diff --stat`
showing only `server/index.js` and the pre-existing 46 modified-tracked
files (all predating Package 1, see
`11-PACKAGE-1-PROTECTED-WORK-VERIFICATION.md`).

## Classification summary

- **PACKAGE 1 NEW FILE**: 14 (migration, 10 services, controller, routes, test script) + 12 docs = 26 real files across 5 new git-status lines + additions inside the pre-existing `docs/audits/` line.
- **PACKAGE 1 MODIFICATION TO EXISTING FILE**: 1 (`server/index.js`, 2 additive lines).
- **PRE-EXISTING MODIFICATION** (not Package 1's): all 46 `M` tracked files except `server/index.js`'s Package-1-specific lines, and all other untracked directories/files from prior packages (Management Sync, Venue Management, Ticket Tapper, CraftHub, Package 0 audit docs).
- **UNRELATED PROTECTED WORK**: `venueManagement`-prefixed files, migrations 075/076 — confirmed untouched, see doc 11.
- **UNKNOWN OR MIXED-OWNERSHIP FILE**: none found.
