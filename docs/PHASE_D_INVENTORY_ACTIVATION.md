# Phase D.4 - Inventory Activation Contracts

## What D.4 Adds

Phase D.4 builds the complete inventory activation contract layer for NOVEE OS, POS360, E.A.T., CraftHub, SmokeCraft, and all venue types. It establishes safe, honest contracts for inventory management across 20 inventory areas with 46 database tables.

## What D.4 Does NOT Do

- Does NOT claim inventory sync is live
- Does NOT claim external POS inventory sync is live
- Does NOT send real vendor orders
- Does NOT send real purchase orders
- Does NOT send real vendor emails
- Does NOT fake stock counts
- Does NOT fake reorder submission
- Does NOT fake COGS accuracy without real imported cost and sales data
- Does NOT fake low-stock alerts from nonexistent inventory data
- Does NOT store vendor secrets, API keys, payment credentials, or private supplier tokens
- Does NOT weaken Phase D.1, D.2, D.3, NOVEE OS C.1-C.7, CraftHub, POS360, E.A.T., or SmokeCraft

## Supported Inventory Areas

| Area Key | Label |
|---|---|
| humidor | Humidor Inventory |
| bar | Bar Inventory |
| kitchen | Kitchen Inventory |
| retail | Retail Inventory |
| general_supplies | General Supplies |
| menu_ingredients | Menu Ingredients |
| cigar_inventory | Cigar Inventory |
| bottle_inventory | Bottle Inventory |
| food_inventory | Food Inventory |
| merchandise_inventory | Merchandise Inventory |
| vendor_catalogs | Vendor Catalogs |
| reorder_rules | Reorder Rules |
| low_stock_alerts | Low Stock Alerts |
| count_sessions | Count Sessions |
| waste_spoilage | Waste / Spoilage |
| transfers | Transfers |
| adjustments | Adjustments |
| import_export | Import / Export |
| external_pos_inventory_signals | External POS Inventory Signals |
| readiness_summary | Readiness Summary |

## Safety Rules

- Do NOT connect to any external inventory system
- Do NOT store vendor API keys, secrets, or tokens in the database
- Do NOT mark any sync as live without real verification
- Do NOT claim COGS is calculated without real cost and sales data
- Do NOT claim low-stock alerts are real without real inventory count data
- Do NOT submit real vendor orders or purchase orders
- Do NOT send real vendor emails
- All areas default to: live_sync_enabled=false, vendor_ordering_enabled=false, auto_reorder_enabled=false, external_pos_sync_enabled=false
- All enforcement flags default to true
- All live/sync/vendor-order processing flags default to false

## Inventory Statuses

- not_started
- setup_required
- mapping_required
- count_required
- import_required
- import_ready
- import_tested
- manual_tracking_ready
- companion_mode_ready
- reorder_rule_ready
- low_stock_rule_ready
- vendor_profile_required
- vendor_profile_ready
- vendor_order_preview_ready
- vendor_order_approval_required
- live_sync_locked
- live_sync_requested
- live_sync_approved
- live_sync_enabled
- disabled / blocked / failed

## No Secret Storage Rule

Vendor credentials are NEVER stored in the application database. The vendor registry tracks public-safe metadata only: contact name, contact email, contact phone, website URL. No API keys, tokens, or secrets.

## No Fake Sync Rule

The `assertNoFakeInventorySyncClaim` function prevents marking any area as live synced. `live_sync_enabled`, `external_pos_sync_live`, `inventory_sync_active`, and `real_time_sync_enabled` cannot be set to true in Phase D.4.

## No Fake Vendor Order Rule

The `assertNoFakeVendorOrderClaim` function prevents fake vendor order submission claims. `is_real_order`, `order_submitted`, `real_vendor_email_sent`, `is_real_po`, and `po_submitted` cannot be set to true in Phase D.4.

## No Fake Count Rule

The `assertNoFakeInventoryCountClaim` function prevents claiming real count completion without actual count data. `is_real_count` requires a `count_date`. `is_real_alert` cannot be true without real inventory count data.

## Humidor / Bar / Kitchen / Retail Support

Dedicated mapping tables for each area:
- **Humidor**: cigar vitola, brand, strength, storage humidity/temperature
- **Bar**: bottle category, brand, size, spirit type
- **Kitchen**: food category, allergen flags, storage type
- **Retail**: retail category, display location

## Item Registry

Items tracked by: item_key, item_label, area_key, category_key, unit_key, SKU, barcode. Items are not synced to external systems in Phase D.4.

## Locations and Storage Zones

- **Locations**: venue, storage, offsite, virtual
- **Storage Zones**: humidor, walk-in, bar, kitchen, retail floor, back office, cellar, freezer, cooler, dry storage, general

## Par Levels

Par quantity thresholds per item per location and zone. Used for reorder trigger calculation only — no automatic reordering.

## Reorder Rules

Reorder threshold and quantity per item. `auto_reorder_enabled=false`. `vendor_order_enabled=false`. `real_order_submission=false`. Rules define configuration only — no vendor orders are triggered.

## Low Stock Rules

Low stock thresholds per item. `alert_preview_only=true`. `requires_real_count=true`. Low-stock alerts are rule records only without real inventory count data.

## Count Sessions

Count session records with count date, counted by, session status. `is_real_count` requires actual `count_date`. Count sessions are records only without real count input.

## Adjustments

Manual adjustment records: area_key, item, location, adjustment_type, quantity_delta, unit, reason, actor.

## Transfers

Transfer records between locations and zones: area_key, item, from/to location, from/to zone, quantity, unit, reason, actor.

## Waste / Spoilage

Waste and spoilage records: area_key, item, location, quantity, unit, waste_type (spoilage, breakage, expired, over_prep, other), reason, actor.

## Vendor Catalogs

Vendor catalog profiles and items with pricing and minimum order quantity. Vendor registry stores public-safe metadata only — no secrets.

## Vendor Order Previews

Vendor order previews: `is_real_order=false`. `order_submitted=false`. `real_vendor_email_sent=false`. Previews show what an order would contain — no real order is created or transmitted.

## Purchase Order Previews

Purchase order previews: `is_real_po=false`. `po_submitted=false`. Previews show what a PO would contain — no real PO is created or transmitted.

## Import / Export

- Import profiles, templates, batches, and batch items for CSV, XLSX, JSON, XML, and POS export formats
- Export profiles per area and format
- Import data is the primary mechanism for feeding real cost and sales data into COGS profiles

## External POS Inventory Signal Mapping

Signal mapping configuration for item depletion, low stock flags, reorder signals, sales mix, and void signals from external POS providers. `live_sync_enabled=false` on all records. External POS inventory sync is not active in Phase D.4.

## COGS Profiles

COGS profiles require real imported cost data and real sales data. `cogs_calculated=false` without real data. `requires_real_cost_data=true`. `requires_real_sales_data=true`. Cost and sales data sources are tracked but not active until data is imported.

## Shrinkage Profiles

Shrinkage and loss tracking profiles by area and period. Tracks estimated value of inventory shrinkage.

## Alert Previews

Alert preview records are rule-based only. `is_real_alert=false`. `requires_real_count=true`. Real alerts require actual count sessions or imported inventory data.

## Live Sync Lock Process

1. Complete D.4 inventory contracts
2. Configure all area statuses
3. Import or enter real inventory data
4. Submit live sync request
5. Receive admin approval
6. Unlock environment lock
7. Enable live sync only after all approvals (Phase D.5+)

## Compliance Checklist

- Inventory data privacy requirements assessed
- Vendor data sharing agreement reviewed
- Import data retention policy defined
- COGS calculation methodology documented
- Waste/spoilage reporting requirements confirmed
- Count session audit requirements confirmed

## Risk Flags

Risk flag registry with severity (low, medium, high, critical) and resolution tracking per area.

## Database Tables (Migration 058)

46 tables total:
1. inventory_activation_area_registry
2. inventory_activation_area_status
3. inventory_location_registry
4. inventory_storage_zone_registry
5. inventory_item_registry
6. inventory_item_category_registry
7. inventory_item_variant_registry
8. inventory_unit_registry
9. inventory_par_level_profiles
10. inventory_reorder_rule_profiles
11. inventory_low_stock_rule_profiles
12. inventory_count_session_profiles
13. inventory_count_session_items
14. inventory_adjustment_records
15. inventory_transfer_records
16. inventory_waste_spoilage_records
17. inventory_vendor_registry
18. inventory_vendor_catalog_profiles
19. inventory_vendor_catalog_items
20. inventory_vendor_order_preview_records
21. inventory_vendor_order_approval_requests
22. inventory_purchase_order_preview_records
23. inventory_import_profiles
24. inventory_import_templates
25. inventory_import_batches
26. inventory_import_batch_items
27. inventory_export_profiles
28. inventory_external_pos_signal_mapping
29. inventory_humidor_mapping
30. inventory_bar_mapping
31. inventory_kitchen_mapping
32. inventory_retail_mapping
33. inventory_menu_ingredient_mapping
34. inventory_recipe_mapping
35. inventory_cogs_profile_records
36. inventory_shrinkage_profile_records
37. inventory_alert_rule_registry
38. inventory_alert_preview_records
39. inventory_live_sync_requests
40. inventory_live_sync_approvals
41. inventory_environment_locks
42. inventory_tenant_mapping
43. inventory_module_mapping
44. inventory_compliance_checklist
45. inventory_risk_flags
46. inventory_activation_audit

## API Routes

Mounted under `/api/phase-d/inventory-activation`. All write routes require `canAccessPOS3`.

Key routes:
- GET/PATCH `/areas`, `/areas/:areaKey/status`
- GET/POST `/locations`, `/storage-zones`
- GET/POST `/items`, `/item-categories`, `/item-variants`, `/units`
- GET/POST `/par-levels`, `/reorder-rules`, `/low-stock-rules`
- GET/POST `/count-sessions`, `/count-session-items`
- GET/POST `/adjustments`, `/transfers`, `/waste-spoilage`
- GET/POST `/vendors`, `/vendor-catalog-profiles`, `/vendor-catalog-items`
- GET/POST `/vendor-order-previews`, `/vendor-order-approvals`
- GET/POST `/purchase-order-previews`
- GET/POST `/import-profiles`, `/import-templates`, `/import-batches`, `/import-batch-items`
- GET/POST `/export-profiles`
- GET/POST `/external-pos-signal-mappings`
- GET/POST `/humidor-mappings`, `/bar-mappings`, `/kitchen-mappings`, `/retail-mappings`
- GET/POST `/menu-ingredient-mappings`, `/recipe-mappings`
- GET/POST `/cogs-profiles`, `/shrinkage-profiles`
- GET/POST `/alert-rules`, `/alert-previews`
- GET/POST `/live-sync-requests`, `/live-sync-lock/:areaKey`
- GET/POST `/tenant-mapping`, `/module-mapping`
- GET/PATCH `/compliance-checklist`
- GET/POST `/risk-flags`, `/audit`
- GET `/readiness-summary`

## Verification Steps

Run: `npm run verify:phase-d-inventory-activation`

Expected: 350+ checks passed.

## Remaining D.5-D.8 Roadmap

- D.5 - Communication Activation: Email, SMS, push notification providers
- D.6 - Security Activation: MFA, SSO, audit hardening
- D.7 - Deployment Activation: CI/CD, white-label, custom domain
- D.8 - Live Pilot Readiness: Full production checklist for first real venue
