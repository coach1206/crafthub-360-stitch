# External POS Sync, Vendor/Distributor/Manufacturer Gateway, and Purchase Order Submission Layer — Phase 18

## What Phase 18 Adds (EOCG)

The External Operations Connector Gateway (EOCG) is a provider-neutral gateway layer that sits underneath the Phase 17 LOCC and connects the platform to external operations infrastructure.

## What EOCG Does

EOCG coordinates:
- External POS connector gateway (Square, Toast, Clover, Lightspeed, Shopify POS, Stripe Terminal, Custom)
- External POS product mapping between internal inventory and POS products
- External POS inventory sync preview (pull/push)
- External POS menu availability sync preview
- External POS webhook preview
- Vendor / distributor / manufacturer connector gateway
- Vendor catalog sync preview
- Vendor product availability check preview
- Purchase order submission gateway (with approval gate)
- Manual export and email-ordering fallback
- Operational sync event consumer foundation
- Multi-user availability push readiness foundation
- External ops event emission (checkout, staff, KDS, NCIE, POS360, E.A.T., LOCC)

## How Phase 16 EPRL Gates Live Operations

Every EOCG service checks:
1. `DATABASE_URL` — absent → `in_memory_only`, `degradedMode: true`, `database_required`
2. `EXTERNAL_POS_API_KEY` — absent → `external_pos_required`, `external_pos_credentials_required`
3. `VENDOR_API_KEY` — absent → `vendor_api_required`, `vendor_credentials_required`
4. `DISTRIBUTOR_API_KEY` — absent → `distributor_connection_required`
5. `MANUFACTURER_API_KEY` — absent → `manufacturer_connection_required`
6. `WEBHOOK_SECRET` — absent → `webhook_secret_required`

None of these values are ever returned in responses. Only presence/absence is reported.

## How Phase 17 LOCC Controls Visibility

EOCG is integrated with LOCC via `loccExternalOpsBridgeService.js`:
- `getLOCCExternalOpsSummary` — full external ops summary for LOCC
- `getLOCCExternalPOSSummary` — POS readiness for LOCC
- `getLOCCVendorGatewaySummary` — vendor readiness for LOCC
- `getLOCCPurchaseOrderSubmissionSummary` — PO submission status for LOCC
- `getLOCCSyncConsumerSummary` — sync consumer status for LOCC
- `getLOCCAvailabilityPushSummary` — push readiness for LOCC
- `buildLOCCExternalOpsPanelData` — full panel data for LOCC dashboard

Role enforcement (from Phase 17 `roleSafetyGateway.js`) applies to purchase order submission:
- Allowed: `owner`, `admin`, `manager`
- Blocked: `guest`, `customer`, `server`, `bartender`, `kitchen_staff`, `humidor_staff`, `cashier`, `host`, `busser`

## What Is Live-Ready

- EOCG foundation layer — ready
- Role safety gateway integration — ready
- LOCC bridge integration — ready
- E.A.T. hooks — ready (12 new hooks)
- POS360 external ops status helper — ready
- ISPAE external ops bridge — ready
- DMRC external submission bridge — ready
- Approval gate enforcement — ready
- Honest degraded-mode responses — ready

## What Is Preview-Only

- External POS sync — `external_sync_not_live`
- Vendor catalog sync — `vendor_catalog_sync_preview_only`
- Purchase order submission — `not_submitted` / `preview_only`
- Sync event consumer — `consumer_preview_only`
- Availability push — `real_time_push_pending`
- Webhook consumer — `webhook_consumer_pending`
- All inventory push/pull — `preview_only`

## Why No Fake Live Sync Is Claimed

The system never claims:
- POS synced
- Payment captured
- Vendor order submitted
- Inventory pushed live
- Real-time push active

All functions return explicit honest status tokens. `canSubmitLive: false` is always true. `autoApprovalDisabled: true` is always true.

## How External POS Sync Is Prepared

Files: `server/services/externalPos/`
- `externalPOSConnectorGateway.js` — provider-neutral gateway for Square, Toast, Clover, Lightspeed, Shopify POS, Stripe Terminal, Custom
- `externalPOSInventorySyncService.js` — pull/push inventory preview
- `externalPOSMenuAvailabilityService.js` — menu availability sync preview
- `externalPOSWebhookService.js` — webhook preview
- `externalPOSProductMappingService.js` — internal ↔ external product mapping

## How POS Product Mapping Works

Each mapping record contains:
- `internalProductId` / `inventoryId` / `venueId`
- `externalPosProductId` / `externalPosVariantId` / `externalPosCategoryId` / `externalPosMenuId`
- `sku` / `barcode` / `productName`
- `syncStatus` (mapping_preview_only until live POS connected)
- `mappingConfidence` (0 until verified)

## How Vendor/Distributor/Manufacturer Gateway Works

Files: `server/services/vendorGateway/`
- `vendorConnectorGateway.js` — unified gateway for all vendor types
- `distributorConnectorService.js` — distributor-specific connector
- `manufacturerConnectorService.js` — manufacturer-specific connector
- `vendorCatalogSyncService.js` — catalog sync preview
- `vendorPurchaseOrderSubmissionService.js` — submission via API / email / CSV / PDF

Connector types: `api`, `email`, `csv_export`, `pdf_export`, `manual_portal`, `phone_required`, `preview_only`

## How Purchase Order Submission Gateway Works

File: `server/services/reorder/purchaseOrderSubmissionGateway.js`

Flow:
1. Load persisted PO draft
2. Validate PO exists
3. Validate actor role (blocks guest/customer/server/bartender/kitchen_staff/humidor_staff)
4. Validate approval status (must be `approved`; `autoApprovalDisabled: true`)
5. Check database availability
6. Check vendor credential readiness
7. If no live method → return `purchase_order_not_submitted`
8. If email channel → return `email_submission_pending_setup`
9. If API → return `api_submission_pending_setup`
10. Record submission attempt
11. Create sync event
12. Report to LOCC

## Why Approval Is Required Before Vendor Submission

DMRC (Phase 14) established that no auto-purchasing is allowed. The approval gate in `validatePurchaseOrderApprovalGate` enforces `approvalStatus === 'approved'` before any submission pathway is attempted. `autoApprovalDisabled: true` is returned in all readiness responses.

## How Operational Sync Event Consumer Works

File: `server/services/sync/operationalSyncEventConsumer.js`

The consumer foundation routes sync events to:
- External POS (`blocked_external_pos_required` if no POS creds)
- Vendor gateway (`blocked_vendor_api_required` if no vendor creds)
- E.A.T., POS360, NCIE, LOCC (all `processed_preview`)

`sync_event_consumer_foundation_ready: true` — foundation is wired. Live consumption requires WebSocket/SSE implementation.

## What Real-Time Push Still Requires

- WebSocket server (`websocket_required`)
- Server-Sent Events endpoint (`sse_required`)
- Webhook consumer (`webhook_required`)
- Live POS credentials
- Live vendor API credentials

## Credentials Needed for Live POS Sync

- `EXTERNAL_POS_API_KEY` — required for all POS operations

## Credentials Needed for Vendor API Sync

- `VENDOR_API_KEY` — required for vendor API orders
- `DISTRIBUTOR_API_KEY` — required for distributor orders
- `MANUFACTURER_API_KEY` — required for manufacturer orders
- `SMTP_HOST` or `SENDGRID_API_KEY` — required for email channel
- `WEBHOOK_SECRET` — required for webhook verification

## What Remains External-Sync-Pending

- `external_sync_not_live` — no external POS connected
- `real_time_push_pending` — no WebSocket/SSE implemented
- `vendor_sync_not_live` — no vendor API connected
- `reorder_not_submitted` — all POs in draft
- `purchase_order_not_submitted` — no live submission
- `distributor_connection_required` — no distributor connected
- `manufacturer_connection_required` — no manufacturer connected

## What Phase 19 Should Handle Next

- Live WebSocket/SSE availability push
- Live webhook consumer for external POS events
- Live vendor API connection (after credentials configured)
- Live purchase order submission flow
- Live inventory reconciliation with POS
- Multi-venue sync orchestration
- Staff/checkout/KDS real-time inventory deduction events

## API Routes

### External POS (`/api/external-pos`)
- `GET /readiness` — POS connection status
- `GET /providers` — supported providers list
- `GET /status` — sync not live status
- `GET /mappings` — product mappings
- `POST /mappings` — create mapping
- `POST /inventory/pull-preview` — pull inventory preview
- `POST /availability/push-preview` — push availability preview
- `POST /menu/sync-preview` — menu sync preview
- `POST /webhook/preview` — webhook preview

### Vendor Gateway (`/api/vendor-gateway`)
- `GET /readiness` — vendor connector status
- `GET /connectors` — supported connector types
- `GET /status` — API required status
- `GET /catalog-preview` — catalog preview
- `POST /catalog/sync-preview` — catalog sync preview
- `POST /product-availability/check-preview` — availability check
- `POST /purchase-order/submit-preview` — PO submit preview
- `POST /purchase-order/export-csv-preview` — CSV export preview
- `POST /purchase-order/export-pdf-preview` — PDF export preview

### Operational Sync (`/api/operational-sync`)
- `GET /readiness` — consumer readiness
- `GET /events/queued` — queued events
- `POST /events/process-preview` — process next event preview
- `POST /events/process-batch-preview` — batch process preview

### Live External Ops (`/api/live-external-ops`)
- `GET /readiness` — live readiness report
- `GET /blockers` — blocker report
- `GET /credentials/status` — credential presence (values never returned)
- `GET /submission-readiness` — PO submission readiness
- `GET /push-readiness` — availability push readiness

## Verification

```bash
npm run verify:external-operations-gateway
```
