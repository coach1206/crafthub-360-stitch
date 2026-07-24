# 03 — Screen Manifest

`src/constants/smokecraftScreenManifest.js` — generated from `VISIT_STRUCTURE` (the confirmed canonical registry) plus `SC_ASSETS`, so it can never silently drift out of sync. Programmatically verified this pass: 31 total entries (4 entry screens + 27 curriculum sessions), exactly 6 phases, exactly 27 curriculum sessions, entry screens carry `sessionNumber: null` (never counted). See `verify-smokecraft-canonical-runtime.mjs` for the automated re-check.

Each entry carries every field the mandate specified (screenId, type, phase, sessionNumber, route, title, componentKey, assetKey, assetStatus, previousScreenId, nextScreenId, prerequisites, guardType, dataSelectorKey, completionKey, interactionManifestKey, persistenceScope, xpEvent, passportEvent, directAccessAllowed, reviewAllowed).
