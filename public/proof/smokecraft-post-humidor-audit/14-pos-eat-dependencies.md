# POS360 and E.A.T. Dependency Audit

## Confirmed existing POS360 infrastructure (audited, not modified)

Real POS360 tables/services exist in this repo (migrations 015, 032,
033, 034, 038, 040, 041, 042, 046, 047, and related
`pos360*Service.js` files) covering venue menu building, handheld
device suite, production display, staff/labor governance, payments/
tips/closeout, customer loyalty, event packages, and fulfillment/KDS
routing. These are a **separate, first-party commerce system** for
bar/restaurant table service — confirmed in the Venue Humidor 1B-2B-5
discovery audit as never wired to SmokeCraft's cigar pairing or
Venue Humidor's cigar-purchase flow.

## Dependency classification

| Dependency | Classification | Notes |
|---|---|---|
| Real payment gateway | Required before production launch | Neither Venue Humidor nor POS360 has a live card/ACH processor integrated — both record payment-status/summary fields only |
| Check or tab ownership | Already satisfied internally (POS360) | POS360 has its own tab/check model; not used by Venue Humidor (intentional separation, confirmed in Venue Humidor discovery audits) |
| Table assignment / bar-to-table movement | Already satisfied internally (POS360) | Exists in POS360's venue-commerce migrations; irrelevant to Venue Humidor's counter-pickup/table-delivery model, which has its own real fulfillment method field |
| Split tender / tips | Already satisfied internally (POS360) | POS360 migration 041 (`pos360_payments_tips_closeout`) |
| Signature | Not found anywhere in this codebase | Optional enhancement if a real payment gateway requiring signature capture is later integrated |
| Staff shift / role PIN | Already satisfied internally (POS360, and separately by Venue Humidor's own `venue_memberships`) | Two independent, appropriately-scoped systems — not a gap |
| Kitchen or service routing | Already satisfied internally (POS360, migration 046) | Not applicable to cigar sales |
| Beverage inventory / venue menu | **Integration boundary — must remain separate** | POS360 has real menu-builder tables (migration 032), but they are not, and per the pairing-engine audit should not be silently, wired into SmokeCraft's abstract-category pairing without a dedicated, explicitly-scoped future package — doing so casually risks exactly the kind of duplicate/competing system this operation has consistently avoided |
| Order routing | Already satisfied internally (POS360) for its own domain; Venue Humidor has its own independent order/fulfillment model | Two correctly-separated systems |
| Refunds / settlement / financial reporting | Required before production launch (for real payment processing); POS360 has its own closeout/settlement scaffolding | Venue Humidor's refund path is an audited event on the existing `status` column, not a real settlement system |
| Customer receipt delivery | Optional enhancement | Venue Humidor has an in-app printable receipt; email/SMS delivery is not built anywhere |
| Staff fulfillment | Already satisfied internally (Venue Humidor has its own complete fulfillment queue, independent of POS360's KDS) | Correctly separated |
| Tax configuration | Partially satisfied | Venue Humidor's checkout records a `tax_cents` field but real jurisdiction-based tax-rate configuration was not found as a dedicated system in either Venue Humidor or POS360 audits |

## E.A.T. dependency

No "E.A.T." system was found anywhere in this codebase by name or by
any service/table matching that acronym in `server/services/` or
`server/db/migrations/`. This audit cannot verify or deny specific
E.A.T. integration claims beyond confirming: **no E.A.T.-named
integration point currently exists in the repository** — if E.A.T. is
an external or planned system, its integration boundary has not yet
been built on the SmokeCraft side. This is reported honestly as "not
found," not guessed at.

## What this means for next-package selection

The only dependency classified **"required before SmokeCraft investor
demo"** from this list is real payment-gateway integration — and only
if the investor demo specifically requires demonstrating a live card
charge; the existing Venue Humidor investor-demo run (1B-2B-6) already
demonstrated the full flow end-to-end using the existing payment-status
boundary without needing a live gateway. Everything else here is either
already satisfied by an existing, correctly-separated system, or is a
deliberate, documented integration boundary that should remain a
boundary rather than be pulled into a general SmokeCraft package.
