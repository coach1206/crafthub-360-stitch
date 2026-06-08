---
name: Phase 9 POS3 Architecture
description: Provider-agnostic POS integration bridge, adapter contract, route permissions, E.A.T. bridge.
---

## Key structural decisions

### requireAuth location
`requireAuth` is exported from `server/middleware/authMiddleware.js`, NOT from `roleMiddleware.js`.
Role guards (requireStaff, requireManager, requireAdmin, requireFounderLevel0, blockDevFounderSpoofing) are in `roleMiddleware.js`.
Always import from both files when building protected routes.

### Route permission tiers for POS3
- Guest (lv0): BLOCKED from all /api/pos3/providers/* and /api/pos3/eat-feed
- Staff (lv1): active orders, menu, tables, recommendations
- Manager (lv2): inventory, staff list, provider status, locations, E.A.T. feed
- Admin (lv3): provider list (/api/pos3/providers), test-connection
- Founder (lv4): /api/pos3/founder/license — must chain requireAuth + blockDevFounderSpoofing + requireFounderLevel0

### Server route mounting in index.js
```
app.use('/api/pos3',              pos3Routes)             // existing activity/payload routes
app.use('/api/pos3/providers',    pos3IntegrationRoutes)  // Phase 9 provider adapter routes
app.use('/api/pos3/eat-feed',     pos3EatFeedRouter)      // Phase 9 E.A.T. feed
app.use('/api/pos3/founder',      pos3FounderRouter)      // Phase 9 founder license panel
```

### Provider adapter contract
Every adapter exports the same 20 functions. Stubs return:
`{ success: false, provider, mode: 'not_configured', message: '...' }`
Only prototypeProvider is fully implemented (no credentials needed).

### prototypeProvider naming conflict
prototypeProvider.js imports normalizeOrder etc. from pos3Normalizer.js using `_` prefix aliases (`_normalizeOrder`) to avoid name collision with its own exported `normalizeOrder` function.

### E.A.T. bridge
`eatPos3BridgeService.js`: syncPOS3ToEAT() → prepareEnvironmentFeed() + prepareAssetFeed() + prepareTransactionFeed() + calculateVenueOpportunityScore(). Returns a single payload with environment/assets/transactions + a 0-100 score.

### DB tables added (migration 004)
pos3_provider_connections, pos3_provider_events, pos3_normalized_orders, pos3_normalized_inventory, pos3_recommendations, pos3_table_mapping

**Why:** Provider-agnostic architecture allows live credentials to be added per-provider without changing any application code — just set env vars and the adapter becomes active.
