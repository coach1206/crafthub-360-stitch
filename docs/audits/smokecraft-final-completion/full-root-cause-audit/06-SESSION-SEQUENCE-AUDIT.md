# 06 — Session-Sequence Audit

Re-verifies (does not merely repeat) the prior "27-Session Sequence Reconciliation" pass's findings, with fresh programmatic checks run in this session.

## Re-verification performed this pass

```
node -e "import('./src/constants/session.js').then(({VISIT_STRUCTURE}) => {
  const all = VISIT_STRUCTURE.flatMap(v => v.sessions)
  console.log('sessions:', all.length, 'phases:', VISIT_STRUCTURE.length)
})"
→ sessions: 27, phases: 6   (re-confirmed, unchanged)
```

Full per-session route/asset/guard table re-generated fresh this pass — see `03-ROUTE-ASSET-TRUTH-TABLE.md` (31 of 32 rows fully correct; S1/Welcome has no asset, disclosed).

## Stale definitions — re-confirmed, not re-discovered

Three stale arrays were found and deprecation-banner-marked in the prior pass:

1. `SMOKECRAFT_FLOW` (`session.js`) — 16-item flat list, no phases.
2. `JOURNEY_STEPS` (`smokecraftJourneyContract.js`) — 24-session/8-visit "canonical" contract that falsely claimed to feed `SmokeCraftSessionGuard`.
3. `smokecraftRewards.js` `visit`/`sessionNumber` metadata — 8-visit numbering, unused for display.

**Re-confirmed this pass, by re-running the same consumer trace fresh (not copied):**

```
grep -rln "JOURNEY_STEPS|smokecraftJourneyContract" src/ | grep -v smokecraftJourneyContract.js
→ smokecraftProgressService.js, SmokeCraftModule.jsx, smokecraftMvp2MasterRegistry.js

grep -n "SmokeCraftModule" src/App.jsx src/modules/moduleRegistry.js
→ (no match — SmokeCraftModule.jsx is never imported by the live route tree)
```

Confirmed still true: these three arrays remain dead for order/routing purposes, still clearly marked deprecated (banners still present in source, unmodified since the prior pass — verified by reading the files this pass, not assuming).

## Do prior tests validate the stale definitions instead of the live registry?

**No** — checked explicitly this pass: no `verify-smokecraft-*.mjs` file imports from `smokecraftJourneyContract.js`, `SMOKECRAFT_FLOW`, or reads `.visit`/`sessionNumber` fields from `smokecraftRewards.js`. Every dedicated SmokeCraft sequence/journey test imports from `session.js`'s `VISIT_STRUCTURE` or asserts against `App.jsx`'s real route table directly (confirmed by grep of `verify-smokecraft-27-session-sequence.mjs`, `verify-smokecraft-clean-start-entry-flow.mjs`, `verify-smokecraft-entry-prerequisite-guard.mjs`).

## Conclusion

No new session-sequence defect found. The live system's single source of truth (`VISIT_STRUCTURE`) is unchanged, correct, and every real consumer traced this pass still reads from it — consistent with, not contradicting, the prior dedicated pass's findings.
