# Phase D — Provider Activation Roadmap

## Phase D Purpose

Phase D activates real external providers, payment processors, integrations, and deployment
infrastructure. Phase C built the foundation. Phase D connects it to the real world.

No Phase D activation is live yet. All providers require external setup, credential provisioning,
legal agreements, and platform verification before activation.

---

## Phase D Order

| Phase | Focus | Status |
|-------|-------|--------|
| D.1 | Provider Activation Roadmap, Live Integration Order & No-Fake Activation Control | Current |
| D.2 | Payment Provider Activation: Stripe / Square / Manual Invoice Contracts | Next |
| D.3 | External POS Provider Activation: Companion, Export/Import, API/Webhook Sync | Not Started |
| D.4 | Inventory Provider Activation: Bar, Kitchen, Humidor, Menu, Stock & Reorder Sync | Not Started |
| D.5 | Communication Provider Activation: Email, SMS, Staff Invites, Guest Notifications | Not Started |
| D.6 | Security Provider Activation: SSO, MFA, Device Trust, IP Allowlist | Not Started |
| D.7 | Deployment Activation: Railway, Domain, White-Label, Environment Verification | Not Started |
| D.8 | Live Pilot Readiness, Venue Activation Checklist & External Provider Launch Lock | Not Started |

---

## What D.1 Does

- Builds the master Phase D command center.
- Defines provider categories, candidates, and recommended activation order.
- Tracks credential placeholder state (no live credentials stored).
- Documents activation blockers, prerequisites, legal/billing/security requirements.
- Establishes readiness matrix for all provider categories.
- Enforces no-fake activation controls at all layers.
- Documents safe and unsafe sales claims.
- Records honest limitations for all provider states.
- Provides the foundation for D.2-D.8 provider activation.

---

## What D.1 Does NOT Do

- Does not connect Stripe, Square, or any payment provider.
- Does not activate billing.
- Does not connect external POS systems.
- Does not enable inventory sync.
- Does not connect email or SMS providers.
- Does not activate SSO or MFA.
- Does not deploy to production.
- Does not enable live mode.
- Does not store credentials, API keys, or tokens.
- Does not fake any provider activation.

---

## Provider Categories

| Category | Activation Phase |
|----------|-----------------|
| deployment | D.7 |
| payments | D.2 |
| billing | D.2 |
| email | D.5 |
| sms | D.5 |
| guest_notifications | D.5 |
| staff_notifications | D.5 |
| external_pos | D.3 |
| inventory | D.4 |
| menu_import | D.4 |
| bar_inventory | D.4 |
| kitchen_inventory | D.4 |
| humidor_inventory | D.4 |
| kds_printer | D.4 |
| sso | D.6 |
| mfa | D.6 |
| device_trust | D.6 |
| ip_allowlist | D.6 |
| domain | D.7 |
| white_label | D.7 |
| custom_domain | D.7 |
| marketplace | D.8 |
| smokecraft_sync | D.8 |
| eat_automation | D.8 |
| reporting_analytics | D.8 |
| tax_engine | D.8 |
| payroll_accounting | D.8 |
| manual_fallback | Always available |

---

## Recommended Activation Order

1. **Deployment / environment verification** (D.7) — Environment must be live before any provider connects.
2. **Payments / billing provider** (D.2) — Stripe or Square required for revenue.
3. **Email / staff invite provider** (D.5) — SendGrid/Mailgun for staff communications.
4. **SMS / guest notification provider** (D.5) — Twilio for guest notifications.
5. **External POS provider** (D.3) — POS sync after communications are live.
6. **Inventory / menu provider** (D.4) — Inventory sync after POS is connected.
7. **KDS / printer provider** (D.4) — Hardware after inventory is synced.
8. **Security provider SSO/MFA** (D.6) — Auth0/Okta after core providers are active.
9. **Marketplace provider** (D.8) — After security is enforced.
10. **White-label / custom domain** (D.7) — Domain after deployment.
11. **SmokeCraft sync** (D.8) — SmokeCraft activation last in sequence.
12. **E.A.T. automation** (D.8) — AI automation in final phase.
13. **Live pilot launch lock** (D.8) — Full readiness check and launch gate.

---

## Required Credentials List

| Provider | Credential Type | Status |
|----------|----------------|--------|
| Stripe | Secret key, Publishable key, Webhook secret | not_requested |
| Square | Access token, Application ID, Location ID | not_requested |
| Twilio | Account SID, Auth token, Phone number | not_requested |
| SendGrid | API key | not_requested |
| Mailgun | API key, Domain | not_requested |
| Auth0 | Domain, Client ID, Client secret | not_requested |
| Okta | Domain, Client ID, Client secret | not_requested |
| Railway | Project token, Environment | not_requested |
| TaxJar | API key | not_requested |
| Avalara | Account ID, License key | not_requested |

All credential statuses: not_requested. No credentials are stored in this system.

---

## Required Testing List

Each provider requires:

1. Sandbox / staging environment test
2. Webhook / event delivery test
3. Error handling and timeout test
4. Rollback test
5. Load / concurrency test (where applicable)
6. Integration smoke test with existing platform features

---

## Required Verification List

Each provider requires external verification:

1. Provider confirms API credentials are valid
2. Platform confirms provider responds to requests
3. End-to-end flow test (order -> payment -> receipt)
4. Security scan of provider connection
5. Data retention / deletion verification
6. Compliance review (PCI DSS for payments, HIPAA if applicable)

---

## Required Rollback List

Each provider requires a rollback plan before activation:

1. Document fallback behavior if provider goes offline
2. Test manual fallback (CSV export, manual invoice, etc.)
3. Confirm data is not lost on provider disconnect
4. Confirm platform degrades gracefully without provider
5. Document rollback execution steps

---

## Safe Claims

The following claims are safe to make:

- Provider activation roadmap foundation is built and verified.
- Phase D activation order is documented and controlled.
- No-fake activation controls are enforced at all layers.
- Credential placeholder system is ready — no live credentials are stored.
- Provider readiness matrix foundation is built.
- 21 provider categories are defined and ordered.
- Provider candidates are documented for all required categories.

---

## Unsafe Claims

The following claims must NOT be made until the corresponding activation is complete:

- "Live provider connected." — not live, activation required.
- "Payment processing is active." — payment_processed: false, Phase D.2 required.
- "Billing is connected." — billing_connected: false, Phase D.2 required.
- "Email delivery is live." — notification_delivery_enabled: false, Phase D.5 required.
- "SSO is connected." — security_provider_connected: false, Phase D.6 required.
- "Production is deployed." — deployment_completed: false, Phase D.7 required.
- "Marketplace transactions are live." — marketplace_transaction_enabled: false, Phase D.8 required.
- "SmokeCraft sync is active." — Phase D.8 required.
- "E.A.T. automation is live." — Phase D.8 required.
- "Live mode is enabled." — all Phase D activations required.

---

## Phase D.2 Next Step

**Phase D.2 — Payment Provider Activation: Stripe / Square / Manual Invoice Contracts**

D.2 will:
- Build the Stripe Connect contract and webhook foundation.
- Build the Square payment integration contract.
- Build the manual invoice fallback contracts.
- Establish the payment activation readiness checklist.
- Create the payment provider testing protocol.
- Document PCI DSS compliance requirements.
- Build payment provider verification scripts.

D.2 does NOT process real payments until credentials are externally provisioned and verified.
