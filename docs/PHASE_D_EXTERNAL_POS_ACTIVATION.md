# Phase D.3 - External POS Activation Contracts

## What D.3 Adds

Phase D.3 builds the complete external POS activation layer. It establishes safe, honest contracts for companion mode, export/import mode, API contract mode, manual mapping mode, and hybrid mode across 11 external POS providers.

## What D.3 Does NOT Do

- Does NOT connect to any external POS
- Does NOT call Toast, Clover, Square POS, Lightspeed, Shopify POS, SpotOn, TouchBistro, or Revel APIs
- Does NOT claim any sales data is imported unless actual files are provided
- Does NOT claim inventory sync is live
- Does NOT claim menu sync is live
- Does NOT claim ticket sync is live
- Does NOT claim payment sync is live
- Does NOT store external POS API keys, secrets, or tokens
- Does NOT fake webhook delivery
- Does NOT fake venue POS readiness

## Supported POS Providers

| Provider Key | Label | Companion | Import | API |
|---|---|---|---|---|
| toast | Toast | Yes | Yes | Future |
| clover | Clover | Yes | Yes | Future |
| square_pos | Square POS | Yes | Yes | Future |
| lightspeed | Lightspeed | Yes | Yes | Future |
| shopify_pos | Shopify POS | Yes | Yes | Future |
| spoton | SpotOn | Yes | Yes | No |
| touchbistro | TouchBistro | Yes | Yes | No |
| revel | Revel | Yes | Yes | No |
| generic_csv | Generic CSV Import | No | Yes | No |
| manual_pos_companion | Manual POS Companion | Yes | No | No |
| future_pos_provider | Future Provider (Placeholder) | No | No | No |

## Activation Modes

### 1. Companion Mode
Staff uses POS360 / E.A.T. beside the existing POS. The existing POS remains the primary payment and ticket system. POS360 / E.A.T. adds guest profiles, loyalty, inventory notes, staff visibility, humidor/bar/kitchen intelligence, and manager dashboards. No connection required.

### 2. Export / Import Mode
Venue exports sales reports, closeout data, item mix, CSV files, or spreadsheets from their existing POS. E.A.T. / POS360 imports or reads that data to generate inventory intelligence, COGS, reorder alerts, sales patterns, menu performance, and operational reporting. Requires actual exported files.

### 3. API Contract Mode
Future mode only. External POS APIs may be connected later after credentials, partner approval, webhook verification, data mapping, and live-mode approval. No API sync is live in Phase D.3.

### 4. Manual Mapping Mode
Venue manually maps menu items, departments, categories, staff roles, sections, tables, taxes, tips, and payment types. User-configured operational mapping, not verified provider sync.

### 5. Hybrid Mode
Venue combines Companion Mode + Import Mode + Manual Mapping while waiting on API approval or for venues that prefer not to use API sync.

## Safety Rules

- Do NOT connect to any external POS
- Do NOT store API keys, secrets, or tokens in the database
- Do NOT mark any provider as connected without real verification
- Do NOT claim any sync is live without actual data transfer
- Do NOT fake webhook delivery
- All providers default to: connected=false, api_sync_enabled=false, webhook_enabled=false, live_mode_enabled=false
- All enforcement flags default to true
- All live/API/sync processing flags default to false

## Provider Statuses

- not_started
- credentials_required
- credentials_present_unverified
- mapping_required
- mapping_in_progress
- import_ready
- import_tested
- api_contract_ready
- api_verification_required
- api_verified_test_mode
- api_live_mode_locked
- live_mode_requested
- live_mode_approved
- live_mode_enabled
- disabled / blocked / failed

## No Secret Storage Rule

External POS credentials are NEVER stored in the application database. Credential status tables track PRESENCE ONLY:
- absent
- present_unverified
- present_verified_test
- present_verified_live
- expired / revoked

## No Fake Sync Rule

The `assertNoFakeExternalPOSConnectedStatus` function prevents marking any provider as connected without verified credentials. The `assertNoFakeExternalPOSSyncClaim` function prevents fake sync language in payloads.

## Mapping Architecture

39 database tables track operational mapping:
- Menu category, menu item, modifier mapping
- Tax, tip, payment type mapping
- Staff role, table section, revenue center mapping
- Department, inventory signal mapping
- Humidor, bar, kitchen mapping
- Order flow, ticket flow, closeout, report mapping

## Database Tables (Migration 057)

39 tables total including:
1. external_pos_provider_registry
2. external_pos_provider_status
3. external_pos_credentials_status
4. external_pos_mode_registry
5. external_pos_companion_mode_profiles
6. external_pos_import_profiles
7. external_pos_csv_import_templates
8. external_pos_import_batches
9. external_pos_import_batch_items
10. external_pos_manual_mapping_profiles
11-28. All mapping tables (menu_category through report)
29. external_pos_api_contract_registry
30. external_pos_webhook_registry
31. external_pos_webhook_health
32. external_pos_live_mode_requests
33. external_pos_live_mode_approvals
34. external_pos_environment_locks
35. external_pos_tenant_mapping
36. external_pos_module_mapping
37. external_pos_compliance_checklist
38. external_pos_risk_flags
39. external_pos_activation_audit

## API Routes

Mounted under `/api/phase-d/external-pos-activation`. All write routes require `canAccessPOS3`.

Key routes:
- GET/POST `/providers`
- GET `/providers/:providerKey/capabilities`
- GET `/modes`
- GET/POST `/credentials`
- GET/POST `/companion-profiles`
- GET/POST `/import-profiles`
- GET/POST `/csv-templates`
- GET/POST `/import-batches`
- GET/POST `/mapping-profiles`
- GET/POST `/mappings/menu-categories` (and 17 other mapping endpoints)
- GET/POST `/api-contracts`
- GET/POST `/webhooks`
- GET/POST `/live-mode-requests`
- GET `/live-mode-lock/:providerKey`
- GET `/readiness-summary`

## Webhook Readiness

Webhook secrets must be configured via environment variables only. Never stored in the database. The webhook registry tracks endpoint URLs and health status only.

## Live Mode Lock Process

1. Configure credentials in environment variables (not database)
2. Register API contract
3. Run test mode verification
4. Submit live mode request
5. Receive admin approval
6. Unlock environment lock
7. Enable live mode only after all approvals

## Compliance Checklist

- POS provider API terms reviewed
- Data sharing agreement assessed
- PCI scope for import data confirmed (no card data)
- Vendor security assessment completed
- Data retention policy defined
- Import data anonymization requirements assessed

## Verification Steps

Run: `npm run verify:phase-d-external-pos-activation`

Expected: 300+ checks passed.

## Remaining D.4-D.8 Roadmap

- D.4 - Inventory Activation: Real-time inventory sync, COGS engine, reorder intelligence
- D.5 - Communication Activation: Email, SMS, push notification providers
- D.6 - Security Activation: MFA, SSO, audit hardening
- D.7 - Deployment Activation: CI/CD, white-label, custom domain
- D.8 - Live Pilot Readiness: Full production checklist for first real venue
