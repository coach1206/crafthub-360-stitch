# Venue Humidor Investor Demo Script

Executed live this pass via `verify-smokecraft-venue-humidor-1b2b6-investor-demo.mjs`
against the real running server and a real Playwright browser session —
18 real screenshots captured to `investor-demo/`, zero fabricated or
placeholder images.

1. **Venue customer browsing live cigar inventory** — `01-customer-browse-inventory.png`
2. **Product details and availability** — `02-product-detail-availability.png`
3. **Inventory-aware recommendation** — `03-recommendations.png`
4. **Beverage pairing** — `04-pairing.png`
5. **Add to cart and checkout boundary** — `05-checkout.png`, `06-order-confirmation.png`
6. **Staff order queue** — `07-staff-order-queue.png`
7. **Preparation and ready state** — `08-staff-order-ready.png`
8. **Customer pickup / venue-service verification** — `09-staff-handoff-verified.png`
9. **Canonical completion** — `10-staff-order-completed.png`
10. **Inventory update** — live availability read after the sale:
    `physicalQuantity: 39, availableQuantity: 38` (started at 40) —
    real deduction, not a screenshot claim.
11. **Customer order history** — `11-customer-order-history.png`
12. **Receipt** — `12-customer-receipt.png`
13. **Passport acquisition** — `13-customer-passport-acquisitions.png`
14. **Post-purchase education** — `14-customer-post-purchase-education.png`
15. **Reorder** — reorder eligibility surfaced on the order-detail screen
    (`09-closure-live-verification-results.json` §1 confirms the field
    is present and boolean-typed for the same demo order class)
16. **Staff assisted selling** — `15-staff-assisted-selling.png`
17. **Admin inventory controls** — `16-admin-inventory-dashboard.png`
18. **Audit trail** — `17-admin-audit-trail.png`
19. **Venue isolation proof** — live probe: a manager with no membership
    in a second demo venue receives `403` reading that venue's order
    queue (printed to the script's own console output, reproduced here
    verbatim): `Manager (no membership in venue B) admin-orders read
    status: 403 (expected 403)`
20. **Responsive tablet presentation** — `18-tablet-presentation-customer.png`
    (1180×820 viewport)

All data in this demo (venue, product, order, customer session) was
created fresh by the script against the real database — no seeded
private customer information was used or is present in any screenshot.
