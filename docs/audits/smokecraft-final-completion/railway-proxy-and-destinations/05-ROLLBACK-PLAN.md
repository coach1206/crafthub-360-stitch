# 05 — Rollback Plan

## Scope of change
- `server/index.js`: added `const TRUST_PROXY = IS_PROD ? 1 : false; app.set('trust proxy', TRUST_PROXY)` and a startup diagnostic block.
- `src/pages/smokecraft/RewardsCenter.jsx`: added a Journey point tile and itemized honest-empty-state venue-reward categories.
- New test + proof + docs (non-runtime).

## If the proxy change must be reverted
`git revert <commit>` restores the prior `server/index.js`. Effect: production
returns to `trust proxy = false` and the `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
failure will resume on Railway. **Do not** revert unless a NEW, worse proxy
problem is observed. If a partial fix is needed instead, adjust only the hop
count (`TRUST_PROXY`) — never switch to `trust proxy = true`.

## If Railway topology changes (more than one trusted proxy hop)
Edit `const TRUST_PROXY = IS_PROD ? 1 : false` — raise `1` to the exact number of
trusted hops. Redeploy; confirm the boot diagnostic prints the new value and that
`/api/health` with an `X-Forwarded-For` header returns 200 (no ERR_ERL).

## If a Rewards field regresses
`RewardsCenter.jsx` is presentational and reads only real session fields. Revert
that file alone to restore the prior 3-tile / single-paragraph empty state; no
backend or route change is entangled.

## Verification after any rollback/roll-forward
Run `verify-smokecraft-railway-proxy-and-destinations.mjs` (needs prod-mode
backend :3001 + `vite preview` :5050) and confirm 32/32, plus the standard
regression set in `04-REGRESSION-MATRIX.md`.

## Non-reversible data
None. No migrations, no schema changes, no persisted-data changes.
