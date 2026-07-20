# Repository Baseline — captured 2026-07-20, no working-tree changes made

## Git state

```
git branch --show-current
recovery/smokecraft-codex-final

git rev-parse HEAD
aa0b9cf86ff8cda0fb86651cfc88a142faea737f

git status --short | wc -l
161

git diff --stat (tail)
 src/pages/smokecraft/SessionComplete.jsx           |  68 ++++
 src/pages/smokecraft/SmokeCraftVenueCommerce.jsx   |  49 ++-
 src/pages/smokecraft/VenueSelect.jsx               |  55 ++++
 src/pages/smokecraft/WelcomeExperience.jsx         |  15 +
 46 files changed, 782 insertions(+), 362 deletions(-)

git diff --cached --stat
(empty — nothing staged)

git log -10 --oneline --decorate
aa0b9cf8 (HEAD -> recovery/smokecraft-codex-final) fix(smokecraft): correct authoritative journey handoff and route guards
a7c73db5 fix(smokecraft): restore approved Golden Box composition with live zones
29a8fff0 fix(smokecraft): restore approved Golden Box live composition
f431d0d7 feat(smokecraft): complete Package A Golden Box and Mentor Selection
6a2775df docs(smokecraft): lock master recovery audit and production sequence
8295d2f6 feat(smokecraft): rebuild Launch and Enroll over approved GitHub design assets
ac8624a1 feat(smokecraft): rebuild Entry Flow (Launch, Enroll, Resume header) as live React
5b2d5ed3 feat(smokecraft): rebuild Identity as live React interface
a124b41e Add SmokeCraft static-shell audit (read-only, no rebuild started)
4b848255 Venue Selection: strict empty state, no fabricated venue records

git remote -v
origin  http://local_proxy@127.0.0.1:41729/git/coach1206/crafthub-360-stitch (fetch)
origin  http://local_proxy@127.0.0.1:41729/git/coach1206/crafthub-360-stitch (push)
```

Full `git status --porcelain=v1` (161 lines) and `git diff --name-status`
are the source data for `01-UNCOMMITTED-PATH-REGISTRY.md` — not
duplicated verbatim here to avoid a second copy going stale.

## Toolchain

- Node: v22.22.2
- npm: 10.9.7
- Package manager / lockfile: npm, `package-lock.json`
- Vite: `^4.3.9`
- React: `^18.2.0`
- React Router: `^react-router-dom@^6.26.2`
- Express: `^4.18.2`
- Database driver: `pg` `^8.11.3` (raw parameterized SQL, no ORM)

## npm scripts (relevant)

- `dev` → `vite`
- `build` → `vite build`
- `preview` → `vite preview`
- `server` → `node server/index.js`
- `start` → `npm run build && node server/index.js`
- `db:migrate` → real migration runner (`server/db/runMigrations.js`),
  transactional per-file, tracked in a `schema_migrations` table.
- No single unified `npm test`. Convention across this entire session:
  standalone `verify-*.mjs` scripts, run directly with `node`, each
  targeting a real disposable local Postgres + real running Express
  server (+ Playwright/chromium for browser-driven suites).

## Verification convention

Every prior package in this session (SmokeCraft Management Sync A-E,
Venue Management Command Hub 6A/6B, Ticket Tapper) was tested against a
real, disposable, isolated local PostgreSQL 16 instance, a real running
Express server, and (for frontend suites) either `vite preview`
(production-build static regression suites) or `vite dev` on port 5000
(live-API browser suites, matching `vite.config.js`'s `/api` proxy).
This is the established, expected convention for any future SmokeCraft
verification work.
