# NCIE Screen Wiring and Educational Tile Integration

Phase 11 of 19 — NOVEE Craft Intelligence Engine (NCIE)

---

## Summary

NCIE screen wiring connects verified educational outlines, mentors, decisions, recommendations, passport mastery, and analytics previews to screens without making OpenAI the source of truth.

Integration is achieved through an adapter-only pattern. No protected SmokeCraft visual files are modified. All NCIE components work as optional overlays, drawers, and buttons that sit on top of or alongside approved screens.

---

## Protected Files — Not Modified

| File | Status |
|---|---|
| `src/components/smokecraft/SmokeCraftAssetScreen.jsx` | `protected_screen_not_modified` |
| `src/components/smokecraft/SmokeCraftHotspotLayer.jsx` | `protected_screen_not_modified` |
| `src/components/smokecraft/SmokeCraftAssetRoute.jsx` | `protected_screen_not_modified` |
| `src/constants/session.js` / `VISIT_STRUCTURE` | `protected_screen_not_modified` |
| `src/utils/passportProgress.js` | `protected_screen_not_modified` |
| `src/utils/passportEntry.js` | `protected_screen_not_modified` |
| `src/constants/smokecraftJourney.js` | `protected_screen_not_modified` |

---

## Adapter Layer

### `src/services/ncie/ncieScreenAdapter.js`
Maps route paths to NCIE screen context. Returns `protected_screen_not_modified` for sealed routes (`/smokecraft/asset`, `/smokecraft/hotspot`). All other screens return safe wiring metadata.

### `src/services/ncie/ncieTileAdapter.js`
Resolves educational tile metadata by `tileId` and `craftType`. Surfaces `lessonStatus: 'verified_outline_available'` for all tiles with verified outlines.

### `src/services/ncie/ncieScreenContextBuilder.js`
Builds a sanitized context object safe for passing to NCIE engines and OpenAI. Blocks 30+ sensitive field types including Stripe tokens, tax IDs, bank account data, API keys, passwords, and payment method IDs.

### `src/services/ncie/ncieAnalyticsAdapter.js`
Preview analytics layer. All events are buffered in-memory per session (`SESSION_EVENT_BUFFER`). Returns `analyticsMode: 'analytics_preview'` and `persistenceStatus: 'not_persisted'` on every event. No data is written to a database.

---

## Educational Tile Registry

### `src/data/ncie/educationalTileRegistry.js`
42 tiles across 4 crafts:
- **SmokeCraft** (14): soil, region, wrapper, leaf impact, flavor, aroma, pairing, humidor, cut, first third, second third, final third, scorecard, passport
- **PourCraft** (8): distillation, grain bill, aging, barrel types, blending, water chemistry, bottling, nosing
- **BeerCraft** (8): malting, brewing, fermentation, yeast, hopping, conditioning, filtration, serving
- **WineCraft** (8): viticulture, harvest, crush, fermentation, barrel aging, blending, bottling, tasting

---

## Screen Maps

| File | Screens | Integration Mode |
|---|---|---|
| `src/data/ncie/screenMaps/smokecraftNcieScreenMap.js` | 24 SmokeCraft screens | `overlay_ready`, `safe_component_import`, `adapter_only` |
| `src/data/ncie/screenMaps/pourcraftNcieScreenMap.js` | 8 PourCraft screens | `future_wire_required` |
| `src/data/ncie/screenMaps/beercraftNcieScreenMap.js` | 8 BeerCraft screens | `future_wire_required` |
| `src/data/ncie/screenMaps/winecraftNcieScreenMap.js` | 8 WineCraft screens | `future_wire_required` |

SmokeCraft screens with `protectedIntegrationMode: 'adapter_only'` include: passport-stamp, connections, management-sync. Screens with `overlay_ready` include: first-third, second-third, final-third (XP-eligible journey steps). The golden-box screen uses `safe_component_import` with quiz enabled.

---

## React Hooks

| Hook | Status Values |
|---|---|
| `useNcieScreenEducation` | `educationStatus: 'ncie_ready'`, `lessonStatus: 'verified_outline_available'`, `screenWiringStatus: 'screen_wiring_ready'` |
| `useNcieMentor` | `mentorStatus: 'mentor_preview'`, `aiStatus: 'ai_unavailable'` (until OpenAI key active) |
| `useNcieDecision` | `decisionStatus: 'decision_preview'` or `'decision_available'` when result exists |
| `useNcieRecommendations` | `inventoryStatus: 'inventory_unavailable'`, `recommendationStatus: 'recommendation_preview'` |
| `useNciePassportMastery` | `passportStatus: 'passport_preview'`, `masteryStatus: 'mastery_preview'` |
| `useNcieAnalytics` | `analyticsStatus: 'analytics_preview'`, `persistenceStatus: 'not_persisted'` |

---

## Screen-Safe UI Wiring Components

All wiring components are in `src/components/ncie/wiring/`. They work as optional overlays and drawers — they do not redesign base screens.

| Component | Purpose | Touch Target |
|---|---|---|
| `NcieScreenEducationLayer` | Wrapper providing education context and lesson overlay | Full screen |
| `NcieTileLearnMoreButton` | Tile-specific learn more trigger | min 44×44px |
| `NcieMentorDrawer` | Mentor selection and session | Bottom sheet |
| `NcieDecisionDrawer` | Decision guide with lesson influences | Bottom sheet |
| `NcieRecommendationDrawer` | Knowledge-based recommendations | Bottom sheet |
| `NcieQuizDrawer` | Topic quiz with analytics | Bottom sheet |
| `NciePassportMasteryDrawer` | XP and mastery display | Bottom sheet |
| `NcieScreenStatusDock` | Dev/preview status overlay | Fixed bottom |

---

## Honest Status Vocabulary

The system never claims:
- `ai_live` / AI generating verified facts / AI real-time data
- `database_saved` / analytics persisted
- `checkout_live` / payment captured
- `inventory_live` / POS synced
- `kds_notified` / production ready
- `customer_data_monetized`

Correct status values used:
- `ncie_ready`, `ncie_preview`
- `ai_unavailable` (until OpenAI key verified)
- `verified_outline_available` (internal outlines are source of truth)
- `analytics_preview`, `not_persisted`
- `mentor_preview`, `decision_preview`, `recommendation_preview`
- `commerce_preview`, `passport_preview`, `mastery_preview`
- `screen_wiring_ready`, `educational_tile_ready`
- `protected_screen_not_modified`
- `inventory_unavailable`

---

## Passport Lock Authority

SmokeCraft Passport stamp locks are enforced by `src/constants/session.js` and `VISIT_STRUCTURE`. NCIE provides XP and mastery data only. The `passportNote` field on all passport-related hooks and engines includes an explicit reference to this authority.

---

## Demo Page

`src/pages/ncie/NcieWiringDemo.jsx` — Interactive demo of all 8 wiring components.  
Route: `/ncie/wiring-demo` (future_wire_required — add to App.jsx when approved).

---

## E.A.T. Readiness Functions

Added to `server/services/eatCommandHubContract.js`:
- `getNcieScreenWiringReadiness()` — overall screen wiring status
- `getCraftEducationTileReadiness(craftType)` — per-craft tile readiness
- `getSmokeCraftEducationReadiness()` — SmokeCraft-specific education status
- `getEducationAnalyticsReadiness()` — analytics preview status
- `getMentorInteractionReadiness()` — mentor session readiness
- `getPassportMasteryReadiness()` — passport XP readiness

---

## Commerce Safety

NCIE never holds or routes funds. The no-custody model is enforced at the NOVEE OS payment authority layer (`src/services/novee/noveePaymentAuthority.js`). Commerce intelligence returns `commerce_preview` until a live checkout integration is verified.

---

## Context Safety

`ncieScreenContextBuilder.js` blocks these field types before any NCIE engine or OpenAI call:
`stripeToken`, `taxId`, `ein`, `ssn`, `bankAccount`, `routingNumber`, `accountNumber`, `cardNumber`, `cvv`, `webhookSecret`, `secretKey`, `apiKey`, `password`, `privateKey`, `stripeConnectId`, `paymentMethodId`, `orderId`, `receiptEmail`, and camelCase/snake_case variants.
