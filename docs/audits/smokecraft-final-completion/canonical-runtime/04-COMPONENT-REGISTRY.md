# 04 — Component Registry

`src/constants/smokecraftComponentRegistry.js` — one `componentKey → component` map. Only `session-21` (AI Summary) is populated and live-migrated this pass. Deliberately not pre-populated with the other 26 curriculum + 4 entry components without also migrating their `App.jsx` routes — doing so would create exactly the kind of silent, unused duplicate definition this pass exists to prevent.

Zero-consumer check (`verify-smokecraft-zero-legacy-runtime.mjs`): confirmed AI Summary has no legacy production consumer outside the registry/renderer path, and the `ai-summary` route resolves through `SmokeCraftScreenRenderer` exactly once, with the bare `<AISummary />` element removed from `App.jsx`.
