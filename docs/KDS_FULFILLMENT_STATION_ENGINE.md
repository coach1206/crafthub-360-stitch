# KDS / Kitchen Routing and Fulfillment Station Engine

## Important Notice

The KDS Fulfillment Station Engine can build routing and dispatch previews, but it does not prove a kitchen, bar, humidor, or partner station was notified unless a live station integration is verified.

All dispatch events are `dispatch_preview`. No live KDS device is claimed to have received an order ticket unless a real KDS integration provides verified connection proof.

## Why KDS Routing Is Required

Before live fulfillment can operate, the platform must know:

1. Which station handles each item category (cigar → humidor, alcohol → bar, food → kitchen)
2. Which items belong to partner vendors and require a partner window
3. Whether multi-station orders need expo consolidation
4. What handoff path is needed (service runner, patio runner, pickup, delivery)
5. Whether any stations are available (health check)

Without the KDS Routing Engine, there is no routing brain — items cannot be directed to the correct preparation or fulfillment station.

## Station Types

| Station | Description |
|---------|-------------|
| `kitchen` | Hot food, cold food, prepared meals |
| `bar` | Alcohol, non-alcoholic beverages |
| `humidor` | Cigars, tobacco products |
| `partner_window` | Partner/vendor-owned items routed to their window |
| `expo` | Consolidation point for multi-station orders |
| `service_runner` | Staff runner from expo to guest table/lounge |
| `patio_runner` | Staff runner for patio seating orders |
| `pickup_handoff` | Counter handoff for pickup orders |
| `delivery_handoff` | Staging for delivery orders |
| `custom` | Venue-defined custom station |

## Default Routing Rules

Item routing defaults when no explicit routing rules are configured:

| Category | Default Station |
|----------|----------------|
| cigar / tobacco | humidor |
| alcohol | bar |
| beverage | bar |
| food | kitchen |
| tasting_flight | kitchen |
| merchandise | expo |
| ticket / event_admission | expo |
| service_fee | expo |
| delivery_fee | delivery_handoff |
| membership | expo |
| general | kitchen |

Custom routing rules override defaults. Rules are sorted by priority (highest first).

## Partner Window Routing

All partner/vendor-owned line items (those with a `partnerId`) route to `partner_window` by default. This is enforced regardless of item category.

- `partner_window_required` is returned in blockers when partner items are present and no partner window station is configured
- Partner items must pass all Phase 6 eligibility gates (venue approval, active product, availability, fulfillment rules, commission agreement) before appearing in any order

## Humidor Routing

Items with category `cigar` or `tobacco` route to `humidor`.

- The humidor station tracks its own health status (`station_unavailable` by default)
- `kds_routing_pending` until a live humidor display integration is verified

## Bar Routing

Items with category `alcohol` or `beverage` route to `bar`.

- Bar station operates in `routing_preview` until live KDS integration is verified
- Alcohol excise tax implications are tracked separately in Phase 7 Tax Engine

## Kitchen Routing

Items with category `food` or `tasting_flight` route to `kitchen`.

- Kitchen station uses `dispatch_preview` mode
- No `ticket printed` or `prep started live` claim is made without verified KDS

## Expo Routing

When an order contains items from more than one station type, `expo_required` is returned. The expo station consolidates all station outputs before handoff.

## Service Runner Flow

Standard lounge/table orders:

```
kitchen/bar/humidor → expo → service_runner → guest
```

## Patio Runner Flow

Patio seating orders:

```
kitchen/bar → expo → patio_runner → patio guest
```

## Pickup / Delivery Handoff

- Pickup orders: `pickup_handoff` station receives consolidated items from expo
- Delivery orders: `delivery_handoff` station stages items for delivery courier

## Station Health

- All stations default to `station_unavailable` without a live KDS device heartbeat
- `updateStationHealthPreview` allows operators to set a manual preview health status
- `getUnavailableStations` returns all stations that have not reported `station_ready`
- Health status never advances to `station_confirmed_live` without proof

## Dispatch Preview Behavior

- `buildDispatchPreview` generates a routing plan and dispatch record in memory
- Every dispatch returns `dispatchMode: 'dispatch_preview'` and `routingStatus: 'kds_routing_pending'`
- No live station is notified
- Dispatch records are stored in memory when `DATABASE_URL` is not set

## Database Fallback Behavior

- When `DATABASE_URL` is not set, all operations use in-memory Maps
- Responses carry `storageMode: 'memory_fallback'`
- Audit events return `status: 'audit_preview'` and `persistenceStatus: 'not_persisted'`

## What Is Live vs Preview-Only

| Feature | Status |
|---------|--------|
| Station config templates | Available (preview) |
| Routing plan generation | Available (preview) |
| Dispatch preview | Available (preview) |
| Fulfillment plan | Available (preview) |
| Handoff plan | Available (preview) |
| Live KDS notification | Preview — requires verified KDS device |
| Ticket printing | Preview — requires KDS integration |
| Station health confirmation | Preview — requires device heartbeat |
| Database persistence | Available when DATABASE_URL is set |

## How Order Lifecycle Consumes KDS Routing

Phase 8 Order Lifecycle `linkKDSRouting(orderId, kdsContext)` links a KDS routing record to an order. The order's `kdsStatus` remains `kds_routing_pending` until a live KDS integration is verified. `routeOrderToStations` from Phase 9 populates the routing plan that can be attached.

## How Partner Vendors Use KDS Routing

Partner-owned items always route to `partner_window`. The routing engine enforces this regardless of item category. The Phase 6 special eligibility engine must pass all gates before a partner item can appear in a dispatchable order.

## How Venue Onboarding Uses Station Readiness

Phase 5 Venue Onboarding can surface `station_config_required` and `station_mapping_required` as blockers in the venue readiness score. Missing station configuration is a warning, not a hard block — venues can operate in preview mode.

## How E.A.T. Can Display KDS Readiness

`getKdsRoutingHooks(venueId, partnerId)` returns:
- `kdsStatus` — always `kds_routing_pending` without live proof
- `routingMode` — always `routing_preview`
- `dispatchMode` — always `dispatch_preview`
- `stationConfigStatus` — `station_config_required` when no stations configured
- `stationMappingStatus` — `station_mapping_required` when no category mappings exist
- `overallHealthStatus` — `station_unavailable` when no live devices
- `kdsHooks` — blockers with severity levels

## Database

Migration: `server/db/migrations/024_kds_fulfillment_station_engine.sql`

Tables: `kds_station_profiles`, `kds_station_mappings`, `kds_routing_rules`, `kds_order_dispatches`, `kds_line_item_dispatches`, `kds_station_health_logs`, `kds_fulfillment_handoffs`, `kds_routing_audit_logs`

## API Endpoints

All KDS endpoints at `/api/kds`. See `server/routes/kdsRoutingRoutes.js`.
