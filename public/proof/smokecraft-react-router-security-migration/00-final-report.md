# SmokeCraft 360 — React Router Major-Version Security Migration
## Production Package 3 of 7 — Final Report

**Starting commit:** `bad227ff4581566c0472157e0b04164b8b3f0156`
**Branch:** `recovery/smokecraft-codex-final`

## 1. Baseline

- `git status`: clean at start
- Local HEAD == `origin/recovery/smokecraft-codex-final` HEAD == `bad227ff` at start

## 2. Discovery

- React: `^18.2.0` (unchanged, out of scope for this migration)
- Router before: `react-router-dom@6.30.4` (transitively `react-router@6.30.4`)
- Router architecture: **single**, declarative — `BrowserRouter` + `Routes`/`Route` in `src/App.jsx`. No `createBrowserRouter`, no `RouterProvider`, no data routers, no loaders/actions, no `MemoryRouter` test helpers anywhere in the repo.
- 291 `<Route>` JSX declarations in `src/App.jsx`; canonical route inventory script (`scripts/smokecraftRouteInventory.mjs`) resolves 132 full nested live paths.
- Direct `react-router-dom` imports found in 182 source files (hooks: `useNavigate`, `useLocation`, `useParams`, `useSearchParams`, `Link`, `NavLink`, `Outlet`, `Navigate`; components: `BrowserRouter`, `Routes`, `Route`). No direct `react-router` (core package) imports anywhere — all consumption goes through `react-router-dom`.
- No `future` flags declared, no `basename` usage, no `unstable_HistoryRouter`, no `createRoutesFromElements`.

## 3. Target version

Checked live npm registry metadata (not memory):

- `npm view react-router-dom dist-tags` → `latest: 7.18.2` (the 8.x line does not exist for `react-router-dom` — as of React Router v8, the DOM bindings were folded into the unified `react-router` package, and `react-router-dom` is only published on the 7.x line going forward)
- `npm view react-router dist-tags` → `latest: 8.3.0`, but `npm view react-router@8.3.0 peerDependencies` → `{ react: '>=19.2.7', react-dom: '>=19.2.7' }` and `engines.node: '>=22.22.0'`. This project runs **React 18.2.0**. A React-19 major upgrade is out of scope for this pass (security/compatibility migration, not a redesign, per mandate).
- `npm view react-router-dom@7.18.2 peerDependencies` → `{ react: '>=18', react-dom: '>=18' }` — compatible with the project's actual React version.

**Target selected: `react-router-dom@7.18.2`** (and its transitive `react-router@7.18.2`) — the latest secure release on the major line compatible with React 18.2.0, current build tooling (Vite 4), and the project's declarative router architecture.

- Release line: React Router v7 (unified routing package, backwards-compatible `react-router-dom` re-export maintained)
- Migration guide used: official React Router v6→v7 upgrade guide (single-step jump; the project uses no future-flag-gated APIs, so no incremental v6.4+ future-flag migration was required first)
- Security issue resolved: `GHSA-wrjc-x8rr-h8h6` — open redirect via backslash in `<Link>`/`useNavigate` (CVE-2025-68470 bypass), fixed range `>=7.18.0`. `GHSA-337j-9hxr-rhxg` — arbitrary constructor injection via `deserializeErrors()` in SSR hydration (not applicable to this app — no SSR — but resolved regardless by the version bump).

## 4. Remaining router-related advisory (documented, not hidden)

`npm audit` after migration still reports one **high**-severity react-router advisory:

- `GHSA-qwww-vcr4-c8h2` — "React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response", affected range `>=7.12.0 <8.3.0`, fixed in `8.3.0`.
- Verified via the official advisory text: **"This only affects your application if you are using the unstable RSC APIs."** SmokeCraft 360 uses zero RSC APIs, zero data routers, zero `loader`/`action` functions — purely declarative `BrowserRouter`/`Routes`/`Route`. **Not applicable to this codebase.**
- The only clean fix for this advisory is `react-router@8.3.0`, which requires React `>=19.2.7` — a major React upgrade, explicitly out of scope for this pass. Documented here rather than silently suppressed, per mandate §15.
- Other pre-existing, unrelated advisories present both before and after this migration and out of scope: `esbuild` (moderate, dev-server only, fixed by a Vite 8 major bump), `postcss` (high, source-map path traversal, unrelated to routing), `shell-quote`/`vite` chain (high, unrelated to routing). None of these were introduced or worsened by this migration.

## 5. Dependency tree result

```
crafthub-360-production@1.0.0
`-- react-router-dom@7.18.2
  `-- react-router@7.18.2
```

Single intentional version line. No duplicate/incompatible router version. `npm ls react-router react-router-dom` output stored in `03-dependency-tree.txt`.

## 6. Breaking changes reviewed (v6→v7)

Given the single-architecture declarative router with no data-router/loader/action/RSC usage, the applicable v6→v7 breaking-change surface was narrow:

- `Routes`/`Route`/`Navigate`/`Outlet`/`Link`/`NavLink`/`useNavigate`/`useLocation`/`useParams`/`useSearchParams` — all retained with unchanged signatures in v7's compatibility layer; no code changes required.
- Relative-splat-path resolution change (v6.4+ future flag `v7_relativeSplatPath`) — not applicable; no splat (`*`) routes used except the single top-level catch-all, which is not nested under a relative-splat consumer.
- `React.startTransition` wrapping of navigations (`v7_startTransition`) — no navigation code depended on synchronous state updates around route changes; verified via full build + fresh-player + final-acceptance regression (below), no behavior change observed.
- No loader/action/fetcher/hydration APIs in use — the v7 data-router breaking changes (error format, `redirect()` helper changes) do not apply.
- No deprecated API usage found (`unstable_HistoryRouter`, `createRoutesFromElements`) before or after.

No code changes to `src/App.jsx` or any of the 182 consuming files were required beyond the package.json/lockfile version bump — confirmed by full route-by-route diff (below) and full regression suite (below).

## 7. Route inventory: before vs after

- Before: 291 `<Route>` declarations captured via `grep -n '<Route ' src/App.jsx` → `routes-before.txt`
- After: 291 `<Route>` declarations, same file, same line numbers → `routes-after.txt`
- `diff routes-before.txt routes-after.txt` → **zero differences, exit 0**
- Canonical route inventory (`scripts/smokecraftRouteInventory.mjs`): 132 full nested live paths, unchanged count before/after.
- No route disappeared, no route added, no route path changed.

## 8. Router architecture result

**PASS.** Single declarative `BrowserRouter` + `Routes`/`Route` tree in `src/App.jsx`. No data-router architecture introduced. No duplicate/incompatible router version.

## 9. Navigation guard result

**PASS.** All guard components (`SmokeCraftSessionGuard`, staff/admin role checks, venue-isolation checks) are React component wrappers around route `element={}` props — not router-level loaders — so the v6→v7 migration does not touch their execution path. Verified functionally via the full fresh-player closure (62/62) and final gameplay acceptance (82/82) regression suites below, both of which exercise session-progression guards end-to-end against the real server.

## 10. Back-navigation result

**PASS.** No history-only navigation patterns were introduced; all existing `Navigate replace` legacy redirects and programmatic `useNavigate()` calls retained unchanged. Verified via final gameplay acceptance's reload-persistence check and manual deep-link/back checks below.

## 11. Route parameter / wildcard / legacy-redirect results

- Parameter routes (`:venueId`, `:cigarId`, `:orderId`, etc.) unchanged; malformed/unknown IDs verified to return `200` with an honest client-rendered empty/error state, not a 500 — spot-checked (`10-security-and-malformed-routes.md`).
- Single top-level wildcard `<Route path="*" element={<Navigate to="/" replace />}>` remains last-registered at its nesting level — verified programmatically by the new validator (line-position check).
- Legacy `<Navigate replace>` compatibility redirects (12+ found, e.g. `intake`→`enroll`, `gold-box`→`golden-box`, `eat-command`→`eat`) all preserved unchanged, all use `replace` (no back-loop), all pre-existing and already documented in `docs/ui-ux-handoff/smokecraft-pos360-eat360/10-COMPLETE-ROUTE-INVENTORY.md`. None removed.

## 12. Route group results

- **SmokeCraft gameplay routes:** PASS — full fresh-player closure 62/62, final gameplay acceptance 82/82 (see `06`/`07`).
- **Venue Humidor routes:** PASS — all 8 Venue Humidor authority validators pass (`08-venue-humidor-results.md`).
- **POS360 routes:** PASS (migration-safety smoke only, per mandate §13 pragmatic scoping) — `/pos3`, `/pos` return `200` post-migration, pre-existing lack of dedicated proof coverage unchanged/undisturbed.
- **E.A.T. 360 routes:** PASS (same scoping) — `/eat`, `/eat-legacy`, `/command-center`, `/eat-command` all return `200` post-migration.

## 13. Security result

- No open redirect introduced; `Navigate to=` targets are all static, hardcoded, internal paths — no user-controlled return-URL is passed unsanitized into `Navigate`/`useNavigate`.
- Malformed/unauthorized/cross-venue param probes all returned `200` with client-rendered honest empty state, never a 500.
- `npm audit` re-run post-migration; results fully documented in §4 above, nothing hidden.
- No vulnerable 6.x router package remains installed (`npm ls` confirms single 7.18.2 line).

## 14. Regression suite

| Suite | Result |
|---|---|
| `npm run build` (incl. full prebuild validator chain) | PASS, `built in 4m 30s`, exit 0 |
| `npm run db:migrate` | PASS, 114 migrations already applied, seed idempotent |
| `scripts/smokecraftRouteInventory.mjs` | PASS, 132 routes extracted |
| `scripts/validateSmokecraftResponsive.mjs` | PASS, 0 checks failed (5-viewport matrix, 132 routes) |
| `scripts/verify-smokecraft-full-game-fresh-player.mjs` | **PASS, 62/62** |
| `scripts/verify-smokecraft-final-gameplay-acceptance.mjs` | **PASS, 82/82** |
| 8x `validateSmokecraftVenueHumidor*Authority.mjs` | PASS, 0 failed each |
| `server/scripts/verifyStripeConnectMoneyBridge.js` | PASS, 38/38 |
| `scripts/validateSmokecraftReactRouterMigration.mjs` (new, this package) | PASS, 0 failed |
| POS360/E.A.T. route smoke (`/pos3`, `/pos`, `/eat`, `/eat-legacy`, `/command-center`, `/eat-command`) | PASS, all 200 |
| Malformed/unknown-ID route probes | PASS, all 200 (no 500) |

## 15. Known limitations (carried forward, not fixed — per mandate §21)

- Mobile/tablet letterboxing on certain screens — pre-existing, unrelated to routing, untouched by this migration.
- Golden Box Rules text overlap — pre-existing, unrelated to routing, untouched by this migration.
- POS360/E.A.T. route groups still lack dedicated production-grade proof coverage (disclosed in the prior handoff package); this migration only confirmed the version bump did not break them, per mandate §13 — it does not retroactively add that coverage.
- `react-router` RSC-mode CVE `GHSA-qwww-vcr4-c8h2` remains technically listed by `npm audit` because the fix requires React 19; confirmed not applicable to this app's architecture (see §4).
- `esbuild`, `postcss`, `shell-quote`/`vite` advisories are pre-existing, unrelated to routing, unchanged by this pass.

## 16. Defects

No new defect discovered. Current highest defects (SC-D068, SC-D068b) unchanged. No SC-D069 assigned — no new proven pre-existing runtime defect surfaced during this migration.

## 17. Commit / push

See `11-git-status-and-push.txt` for final `git status`, commit hash, and push confirmation.

## 18. Recommended next production package

Production Package 4 of 7 — per the operation's existing sequence (venue onboarding / infra-adjacent hardening or the next disclosed production surface), to be confirmed against the master package plan before starting. Infra deployment/monitoring/legal-compliance/launch-closure explicitly NOT begun during this pass, per mandate.
