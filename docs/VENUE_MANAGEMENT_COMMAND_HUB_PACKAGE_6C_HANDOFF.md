# Package 6C Handoff — Products, Cigars, Menus, and Pairings

## Reusable from 6A/6B (do not rebuild)
- Media service (`mediaService.js`) — reuse for product/cigar images.
- Profile/branding routes and auth chain
  (`requireAuth`/`requireValidVenue`/`requireVenueMembership`/
  `requireVenuePermission`/`auditAction('VENUE', …)`).
- Permission-key convention (`venueManagementRoles.js`) — add new keys
  there (`venue_management.products.edit`, etc.), don't invent a second
  constants file.
- Lifecycle/version-history table (`venue_management_content_versions`)
  — add `'product'`/`'menu'`/`'menu_item'` entity_type rows (already in
  the CHECK constraint from 6A) rather than a new versioning table.
- Storage limitation: still NOT_CONFIGURED — product image uploads will
  hit the same local-dev-only ceiling.

## New schema needed
- No `products`/`cigars` table exists anywhere in this codebase — build
  from scratch. **Do not** reuse `pos360_menu_items`/`venue_menu_items`
  directly (they're POS-floor/order-facing, different shape/purpose) —
  either a new `venue_management_products` table referencing them for
  POS sync later, or an explicitly documented bridge if reuse is chosen.
- Pairing relationships: no existing table — cigar/beverage pairing
  content is a genuinely new concept, distinct from `pairingOrderRoutes.js`
  (which is POS order-pairing, unrelated).
- Pricing: if products need pricing, a permission key
  (`venue_management.pricing.edit`) should gate it separately from
  general content edit — pricing changes are higher-risk.

## Duplication risk carried forward
Two menu-item tables already exist (`venue_menu_items` migration 015,
`pos360_menu_items` migration 032) — Package 6C must pick one lineage
explicitly and document why, not add a third.

## Tests required
Same isolation/lifecycle/audit pattern as 6B's 33-check suite, plus
product-specific: price validation, inventory-flag honesty (Inventory
remains NOT_CONFIGURED per Package E — do not fabricate stock levels).

## Not built in 6B (do not assume it exists)
Menus, pairings, events, challenges, staff management — all fully
out of scope for 6B, as instructed.
