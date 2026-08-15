# Issue #44 — npm vulnerability remediation

## Result

- Safe lockfile-only updates applied with `npm audit fix` (no `--force`).
- `body-parser` 1.20.5 → 1.20.6.
- `nanoid` 3.3.12 → 3.3.18.
- `postcss` 8.5.15 → 8.5.26.
- `shell-quote` 1.8.4 → 1.10.0.
- Production audit: **0 high, 0 critical**.
- Clean install and production build: **PASS**.

## Original high findings

| Finding | Dependency tree | Classification | Disposition |
|---|---|---|---|
| `shell-quote` | `concurrently` → `shell-quote` | Dev-only. `concurrently` is a `devDependency` used by `dev:full`; it is not loaded by `node server/index.js`. | Fixed non-breakingly by lockfile update to 1.10.0. |
| `concurrently` | root dev dependency → `concurrently` → vulnerable `shell-quote` | Dev-only aggregate finding. | Cleared when `shell-quote` was updated. |
| `postcss` | root dev dependency / `tailwindcss` / `autoprefixer` → `postcss` | Build-time only. The deployed application serves generated CSS and does not process attacker-supplied CSS or source maps at runtime. | Fixed non-breakingly by lockfile update to 8.5.26. |
| `vite` | root dev dependency → `vite` → `esbuild` / `postcss` | Dev/build-only. Vite's dev server and launch-editor endpoints are not the production Express server. | PostCSS portion fixed. Remaining Vite/esbuild advisory is dev-only; major Vite 8 migration is intentionally isolated from this non-breaking security patch. |

The later `nanoid` high advisory observed during remediation was also in the dev-only PostCSS tree and was removed by the safe lockfile update.

## Residual findings

- Vite/esbuild: dev-server-only; omitted from the production dependency graph. Do not expose `vite`, `vite preview`, or a Vite development server publicly.
- React Router moderate advisories: production dependency. The SSR hydration advisory is unreachable because this project builds a client-side SPA, not React Router SSR. The redirect advisory requires a separate tested React Router 7 migration or strict validation of every user-controlled navigation target; it is tracked as residual moderate risk and does not violate the high/critical production gate.

## Required verification

Run on Node 22 from a clean checkout:

```sh
npm ci
npm audit --omit=dev --audit-level=high
npm run build
npm run acceptance:crafthub:structural
```

Acceptance requires:

1. `npm ci` exits 0 and does not modify `package-lock.json`.
2. Production audit exits 0 with zero high and zero critical vulnerabilities.
3. The Vite production bundle builds successfully.
4. Structural acceptance exits 0.
5. GitHub's CraftHub Production Acceptance workflow passes on the exact commit.
6. The deployed acceptance job resolves the deployment for the exact commit and passes HTTP and browser journey proof.

Production security is not blocked when all six gates pass. A full audit may still show dev-only Vite/esbuild findings; those do not ship in `npm ci --omit=dev` and must not be represented as production-runtime exposure.
