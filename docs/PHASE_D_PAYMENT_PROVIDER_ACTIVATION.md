# Phase D.2 - Payment Provider Activation Contracts

## Overview

Phase D.2 builds the payment provider activation layer for the NOVEE / CraftHub / POS360 platform. It establishes a complete, honest, auditable framework for activating Stripe, Square, Manual Invoice, Cash/Offline, and future payment providers.

## Critical Safety Rules

- Do NOT process real payments without live credentials and admin approval
- Do NOT create live charges without verified live credentials
- Do NOT store raw card data anywhere on this platform
- Do NOT store API secrets in the application database
- Do NOT fake Stripe or Square connection status
- Do NOT fake invoice payment completion
- Do NOT mark any provider as connected unless real credentials pass validation
- Do NOT weaken Phase C.1-C.7 NOVEE OS protections
- Do NOT weaken Phase D.1 provider roadmap protections
- Do NOT remove existing feature flags, auth gates, or route guards

## Payment Providers

| Provider Key | Label | Default Status |
|---|---|---|
| stripe | Stripe | not_started |
| square | Square | not_started |
| manual_invoice | Manual Invoice | not_started |
| cash_offline | Cash / Offline | not_started |
| future_placeholder | Future Provider (Placeholder) | not_started |

## Provider Activation Statuses

| Status | Meaning |
|---|---|
| not_started | No activation attempt made |
| credentials_required | Provider chosen, credentials not yet supplied |
| credentials_present_unverified | Credentials present in env, not yet tested |
| verification_failed | Credential test failed |
| verified_test_mode | Credentials valid in test/sandbox mode |
| verified_live_mode_locked | Test verified, live mode locked pending approval |
| live_mode_requested | Live mode unlock request submitted |
| live_mode_approved | Live mode approved by authorized admin |
| live_mode_enabled | Live mode active with verified live credentials |

## Database Tables (Migration 056)

1. payment_provider_registry
2. payment_provider_credentials_status
3. payment_provider_environment_locks
4. payment_provider_live_mode_requests
5. payment_provider_compliance_checks
6. payment_provider_audit_log
7. stripe_activation_config
8. stripe_webhook_config
9. stripe_connect_config
10. square_activation_config
11. square_webhook_config
12. square_location_config
13. manual_invoice_config
14. manual_invoice_templates
15. cash_offline_config
16. cash_offline_sessions
17. payment_pci_scope
18. payment_webhook_registry
19. payment_refund_rules
20. payment_tax_integration
21. payment_reporting_config
22. payment_reconciliation_log
23. payment_payout_config
24. payment_feature_flags_log
25. payment_provider_blockers

## API Routes

All routes are mounted under `/api/phase-d/payment-provider-activation`.
All write routes (`POST`, `PATCH`) require `canAccessPOS3` (platform admin guard).

| Method | Path | Description |
|---|---|---|
| GET | /providers | List all payment providers |
| GET | /providers/:providerKey | Get single provider |
| POST | /providers | Register provider (admin) |
| PATCH | /providers/:providerKey/status | Update provider status (admin) |
| GET | /credentials | List credential statuses |
| GET | /credentials/:providerKey | Get credential status |
| POST | /credentials | Update credential status (admin) |
| GET | /environment-locks | List environment locks |
| GET | /environment-locks/:providerKey | Get lock for provider |
| POST | /environment-locks | Update lock (admin) |
| GET | /live-mode-requests | List live mode requests |
| POST | /live-mode-requests | Submit live mode request (admin) |
| PATCH | /live-mode-requests/:requestId/approve | Approve request (admin) |
| GET | /compliance | List compliance checks |
| POST | /compliance | Create compliance check (admin) |
| GET | /audit | List audit events |
| POST | /audit | Write audit event (admin) |
| GET | /stripe/status | Get Stripe activation status |
| POST | /stripe/config | Update Stripe config (admin) |
| GET | /square/status | Get Square activation status |
| POST | /square/config | Update Square config (admin) |
| GET | /manual-invoice/config | Get manual invoice config |
| POST | /manual-invoice/config | Update config (admin) |
| GET | /cash-offline/config | Get cash/offline config |
| POST | /cash-offline/config | Update config (admin) |
| GET | /safety-status | Get safety enforcement status |
| GET | /pci-scope | List PCI scope items |
| POST | /pci-scope | Create PCI scope item (admin) |
| GET | /webhooks | List webhook endpoints |
| POST | /webhooks | Register webhook (admin) |
| GET | /refund-rules | List refund rules |
| POST | /refund-rules | Create refund rule (admin) |

## Feature Flags

All payment processing and live mode flags default to `false`.
All enforcement flags default to `true` and must never be overridden to false in production.

Key enforcement flags:
- `noFakePaymentProcessingEnforced: true`
- `noRawCardDataStorageEnforced: true`
- `noSecretsInDatabaseEnforced: true`
- `noFakeProviderConnectionEnforced: true`
- `liveModeApprovalGateRequired: true`
- `platformAdminGuardRequired: true`
- `auditTrailRequired: true`
- `idempotencyEnforced: true`

## Credential Security

Credentials are NEVER stored in the application database. They are managed exclusively via environment variables:

- `STRIPE_SECRET_KEY` - Stripe secret key (sk_live_... or sk_test_...)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `SQUARE_ACCESS_TOKEN` - Square access token
- `SQUARE_APPLICATION_ID` - Square application ID
- `SQUARE_LOCATION_ID` - Square location ID

The credential status tables track only PRESENCE and VERIFICATION STATUS, never the actual credential values.

## Activation Prerequisites

Before any payment provider can be activated in live mode:

1. Phase C.1-C.7 NOVEE OS fully operational
2. Phase D.1 Provider Roadmap completed
3. Business KYB/KYC completed with payment processor
4. Business bank account verified
5. PCI DSS SAQ completed
6. Legal terms accepted for each provider
7. Environment lock explicitly unlocked by authorized admin
8. Live mode request submitted and approved
9. Live credentials configured in environment variables
10. Post-activation verification completed

## Honest Limitations

- No payments are processed at this phase
- No live credentials are configured by default
- All providers start in not_started status
- All live mode flags default to false
- Environment locks are active on all providers
- Real activation requires manual steps outside this codebase (account creation, KYB, bank linking)
