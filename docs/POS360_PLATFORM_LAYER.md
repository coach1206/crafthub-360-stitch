# POS360 Platform Layer

> POS integration is not one feature. It is a platform layer. Build the POS360 hub once, then every POS provider becomes a plug-in instead of a custom rebuild every time.

---

## Why POS Integration Is a Platform Layer

Connecting SmokeCraft to a POS provider is not a one-time Square integration. Each POS provider has:

- Its own OAuth flow
- Its own API shape
- Its own item/catalog schema
- Its own inventory endpoints
- Its own webhook format and signature scheme
- Its own rate limits and error codes
- Its own partner approval requirements (e.g. Toast requires Toast Partner Program approval)

If SmokeCraft were wired directly to Square, adding Toast later would require rebuilding the order flow, the inventory sync, and the webhook handler from scratch. Adding Clover after that would require a third rebuild.

**POS360 solves this by being the center.**

---

## Architecture

```
SmokeCraft Ticket Tapper Order
          ↓
POS360 Integration Hub          ← single entry point for all POS operations
          ↓
Provider Adapter Layer           ← one adapter per POS provider
          ↓
Square | Toast | Clover | Lightspeed | Shopify POS | Manual POS360 | Future Provider
```

SmokeCraft never talks directly to Square. It talks to POS360. POS360 talks to the adapter. The adapter handles provider-specific details.

---

## Why POS360 Is the Hub

| Without POS360 Hub | With POS360 Hub |
|---|---|
| Square wired into SmokeCraft order logic | SmokeCraft calls POS360, POS360 calls Square |
| Adding Toast → rewrite SmokeCraft order flow | Adding Toast → add Toast adapter, register in hub |
| Provider error reaches customer screen | Hub normalizes errors to safe statuses |
| Duplicate orders possible on retry | Idempotency keys block duplicates |
| Tokens stored anywhere | Tokens encrypted (AES-256-CBC), never plaintext |
| No audit trail | Every operation logged in pos360_audit_logs |

---

## How Providers Plug In

1. Create `server/services/pos/providers/yourProviderAdapter.js`
2. Extend `BasePosProviderAdapter`
3. Implement the required methods (at minimum: `beginOAuth`, `createOrder`, `syncInventory`, `handleWebhook`, `verifyWebhookSignature`)
4. Add provider env vars to `server/config/posProviderConfig.js`
5. Register the adapter in `pos360IntegrationHub.getProviderAdapter()`
6. Create item mappings in `pos_menu_item_mappings` via the mapping service
7. Run migration 018 (or add columns if extending)

No SmokeCraft frontend code changes required to add a new provider.

---

## How Manual POS360 Fallback Works

Venues without a supported POS provider use `manual_pos360`:

- No OAuth required
- No external API calls
- Order creates a `pos360_manual_orders` record (a printable ticket)
- Staff acknowledges the ticket manually
- Routing station is set (bar / humidor / kitchen / partner / server_pickup)
- Customer sees `pending` → `preparing` → `ready` (manually updated by staff)

Manual POS360 never claims to be a live POS sync. All statuses are `manual_mode`.

---

## Why Item Mapping Matters

A SmokeCraft menu item ("Padrón 1964 Natural Robusto") does not automatically correspond to a provider item. The provider's catalog may call it "Padron 1964 Robusto" with a different SKU, variation ID, and category.

**Without mapping:**
- The hub cannot push the order to the provider
- Order fails silently or creates incorrect items

**With mapping:**
- Each SmokeCraft item is matched to its exact provider item ID
- Missing mappings block live order push and return `mapping_required`
- Mappings are confirmed by staff, not guessed by the system

---

## Why OAuth / Token Encryption Matters

POS provider access tokens grant the ability to:
- Read all orders and customer data
- Push orders to the POS
- Modify menu items

If tokens are stored in plaintext or exposed in API responses:
- Any server compromise exposes all venue POS access
- Tokens cannot be revoked systematically
- Audit trail has no record of token exposure

**POS360 encrypts all tokens with AES-256-CBC before database storage.**
Raw tokens are:
- Never stored in plaintext
- Never returned in API responses
- Never logged
- Masked (`abcd****`) only when required for display

Required env var: `ENCRYPTION_SECRET` or `TOKEN_ENCRYPTION_KEY`

---

## What Is Live vs Not Live

| Feature | Current Status |
|---|---|
| PostgreSQL persistence | `database_required` — DATABASE_URL not configured |
| Square OAuth | `oauth_required` — credentials not configured |
| Toast integration | `partner_approval_required` — Toast Partner Program approval needed |
| Clover OAuth | `oauth_required` — credentials not configured |
| Lightspeed OAuth | `oauth_required` — credentials not configured |
| Shopify POS OAuth | `oauth_required` — credentials not configured |
| Manual POS360 | `manual_mode` — available now, no OAuth required |
| Stripe Connect settlement | `integration_required` — not implemented |
| KDS / kitchen display | `routing_preview` — no KDS connected |
| Real-time push | `real_time_ready` — attach point annotated, not wired |
| Tax compliance | `preview_only` — preview rate until venue/state config verified |

---

## Future Provider Onboarding Order

For each new POS provider:

1. Obtain partner agreement / developer program approval (some providers require this: Toast, Lightspeed)
2. Register app in provider developer console → get client ID + secret
3. Add env vars to `posProviderConfig.js`
4. Implement OAuth flow in the provider adapter
5. Implement `syncMenu()` using provider's catalog/menu API
6. Implement `syncInventory()` using provider's inventory API
7. Implement `createOrder()` using provider's orders API
8. Implement `verifyWebhookSignature()` using provider's webhook secret
9. Build item mappings for the venue
10. Test in provider sandbox environment
11. Update connection status from `oauth_required` → `connected_pending_sync` → `sync_required`

---

## Recommended Next Phases

- **Phase 11**: Stripe Connect integration for Money Bridge settlement
- **Phase 12**: Square OAuth + catalog sync (highest venue demand)
- **Phase 13**: KDS integration (kitchen display) for real kitchen routing
- **Phase 14**: Real-time push (WebSocket / Supabase Realtime) for live specials
- **Phase 15**: Toast Partner Program approval + integration
- **Phase 16**: Venue tax compliance (connect to Avalara or TaxJar)
- **Phase 17**: Full E.A.T. Command Hub live management UI
