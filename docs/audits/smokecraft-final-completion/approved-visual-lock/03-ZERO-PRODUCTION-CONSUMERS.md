# Zero Production Consumers — proof

Evidence that no retired/legacy SmokeCraft visual has a production consumer after
this pass. All facts reproduced from `grep`/build at commit tip of this pass.

## Retired components

| Retired artifact | Production consumers | Evidence |
|---|---|---|
| `Format.legacy.jsx` | 0 (file deleted) | `grep -rn "Format.legacy" src server` → empty; file removed via `git rm` |
| `SmokeCraftModule.jsx` (`src/modules/smokecraft/`) | 0 in App/renderer | not imported by `App.jsx` or `SmokeCraftScreenRenderer.jsx`; only a doc-comment mention |
| 21 canonical components as direct App imports | 0 | `grep -nE "<(HumidorMatch\|AISummary\|…)[ />]"` in App.jsx → empty; imports removed |

## Retired / deprecated data

| Artifact | Real consumers | Status |
|---|---|---|
| `SMOKECRAFT_FLOW` | `getNextSmokecraftRoute`/`getLastSmokecraftRoute` (same file only); those helpers have 0 external consumers | dead, unchanged |
| `JOURNEY_STEPS` / `smokecraftJourneyContract.js` | only inside dead `src/modules/smokecraft/` | dead, unchanged |

## Canonical render path is the only path

- Every `session-N` route in `App.jsx` renders `<SmokeCraftScreenRenderer />`.
- `SmokeCraftScreenRenderer` resolves component from `smokecraftComponentRegistry.js`
  and **throws** (no silent fallback) if a screenId is unregistered.
- The 21 canonical components are reachable **only** through the registry; App.jsx
  no longer imports or renders any of them directly.

## Automated gate

`verify-smokecraft-zero-old-visuals.mjs` (new this pass) encodes all 10 mandate
conditions as deterministic source assertions and passes **20/20**. It FAILS (by
construction) if any retired component gains a production consumer, any old asset
key goes active, a fallback can replace an approved screen, a direct route renders
an old screen, an active screen bypasses the component or asset registry, Humidor
Match gains duplicate controls, any screen becomes static-only, or any required
visual marker goes missing.
