# Tax Profiles and Compliance Engine

## Important Notice

This engine supports tax calculation previews and readiness checks, but it does not provide legal tax advice or guarantee tax compliance.

All tax amounts produced by this engine are estimates or previews only. Before collecting or remitting taxes in any jurisdiction, the operator must complete a CPA/legal compliance review and configure verified jurisdiction data.

## Why Tax Profiles Are Required

Before any live commerce, Stripe settlement, or vendor payouts can go live, the platform must know:

1. What jurisdiction the venue operates in (state, county, city)
2. What tax categories apply to items sold (food, tobacco/cigar, alcohol, merchandise, etc.)
3. What tax rules/rates apply to each category in each jurisdiction
4. Who is the merchant of record when partner vendors sell at the venue
5. Whether any exemptions apply

Without this information, all tax amounts remain at `tax_preview` status using a fallback rate (8.5%). This is not a legal default — it is a placeholder.

## Venue Tax Profile Setup

A venue tax profile must be created before tax rules can be configured.

```
Profile status progression:
tax_profile_required → tax_config_required → tax_calculation_ready
```

All profiles default to `compliance_review_required` until a CPA/legal review is completed.

## Jurisdiction Setup

Each venue needs at least one jurisdiction record specifying:
- Country, state, county, city, postal code
- `source_status`: manual (operator-entered) or third-party (tax API)

Without a jurisdiction record, `jurisdiction_status === 'jurisdiction_required'` and tax calculation returns `tax_preview`.

## Category Setup

Supported tax categories:
- `tobacco` / `cigar` — typically have excise taxes and special rates
- `alcohol` — typically have excise taxes and special rates
- `food` — may be exempt or taxed differently by jurisdiction
- `beverage` — non-alcoholic beverages may have different rates
- `merchandise` — general merchandise rates
- `ticket` / `event_admission` — varies by jurisdiction
- `service_fee` / `delivery_fee` — taxability varies by jurisdiction
- `membership` — may be exempt
- `tasting_flight` — typically treated as food/beverage

## Tax Rule Setup

Rules bind a category to a rate within a jurisdiction:

```
Rule fields:
- category_code: which category this applies to
- tax_rate: percentage (e.g., 0.085 = 8.5%)
- fixed_fee: per-item or per-order flat fee in cents
- included_in_price: tax is already in the displayed price
- compound_tax: tax is applied on top of another tax
```

Without rules for a category, `taxStatus === 'tax_rule_missing'` and the fallback preview rate applies.

## Partner/Vendor Tax Profile Setup

Each partner vendor requires a separate tax profile covering:
- `merchant_of_record_status`: whether the venue or the partner bears tax collection responsibility
- `tax_collection_status`: whether partner is responsible for collecting tax on their items

Options for `merchant_of_record_status`:
- `merchant_of_record_required` — not yet decided
- `venue_is_merchant_of_record` — venue collects tax on all items including partner items
- `partner_is_merchant_of_record` — partner is responsible for their own tax collection

**This distinction has significant legal implications and requires legal/CPA guidance.**

## Tax Preview Behavior

When tax rules are incomplete:
- `taxStatus: 'tax_preview'` — fallback rate applied, not legally valid
- `taxStatus: 'tax_estimate'` — rules configured, but CPA review still pending
- `taxStatus: 'tax_calculation_ready'` — rules configured and validated (still not legally certified)

The system never returns `tax_compliant`, `legally_compliant`, `certified`, `remitted`, or `filed`.

## How Money Bridge Uses Tax Preview

Phase 4 Money Bridge (`calculateTaxForPayment`) accepts a `venueTaxConfig` parameter. When provided:
- `is_verified: true` → uses configured rate, returns `taxStatus: 'venue_config'`
- `is_verified: false` → uses configured rate, returns `taxStatus: 'preview_only'`
- No config → uses fallback 8.5% rate, returns `taxStatus: 'preview_only'`

The Tax Profiles engine provides the `venueTaxConfig` for Money Bridge to consume.

## How Venue Onboarding Uses Tax Readiness

Phase 5 Venue Onboarding tracks `tax_status` in `venue_onboarding_status`. A tax profile reduces the readiness score penalty when configured. Missing tax profile contributes to `compliance_review_required` warnings in the E.A.T. Command Hub.

## How Partner Vendor Onboarding Uses Tax Readiness

Phase 6 Partner Vendor Onboarding tracks `merchant_of_record_status`. Missing merchant-of-record designation blocks selling readiness and appears as a blocker in special eligibility checks.

## How E.A.T. Can Display Tax Readiness

`getTaxReadinessHooks(venueId, partnerId)` returns:
- `taxReadinessStatus` — current status
- `taxReadinessScore` — 0–100 based on profile/jurisdiction/category/rule completeness
- `blockers` — list of missing items with severity
- `complianceNote` — always present, always honest

## What Still Requires CPA/Legal Review

- Actual tax rates for each category and jurisdiction
- Whether specific items are taxable or exempt in a given state
- Merchant of record designation for partner transactions
- Whether the venue must remit collected taxes on behalf of partners
- Tobacco/cigar excise tax compliance (highly jurisdiction-specific)
- Alcohol excise tax compliance (highly jurisdiction-specific)
- Whether delivery/service fees are taxable in the venue's state

## Database

Migration: `server/db/migrations/022_tax_profiles_compliance_engine.sql`

Tables: `venue_tax_profiles`, `venue_tax_jurisdictions`, `venue_tax_categories`, `venue_tax_rules`, `partner_vendor_tax_profiles`, `order_tax_calculation_logs`, `tax_exemption_records`, `tax_audit_logs`

## API Endpoints

All tax endpoints at `/api/tax`. See `server/routes/taxComplianceRoutes.js`.
