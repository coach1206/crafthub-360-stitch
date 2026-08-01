# Venue Humidor Media and Product Image Management — Architecture and Data Model

## Reuse-first decisions

- **RBAC/identity**: reused the existing `venues` / `venue_memberships`
  tables and `requireVenueStaff` / `requireVenueRole` middleware chain
  from `server/routes/venueHumidorRoutes.js` (migration 010 membership
  model). No parallel identity or role concept invented.
- **Product identity**: reused `venue_cigar_products` (migration 106)
  as the sole authority for `product_id`/`sku`/`brand`/`vitola`. Media
  rows reference `product_id` by foreign key; product-image identity
  is asserted server-side in `assertProductBelongsToVenue()` before any
  write.
- **File validation + local-disk storage adapter**: reused
  `server/services/venueManagement/imageValidation.js` (magic-byte MIME
  sniffing, PNG/JPEG/WEBP dimension parsing, filename normalization)
  and `server/services/venueManagement/storageAdapter.js` (local-dev
  disk fallback, explicitly labeled `STORAGE_PROVIDER_STATUS =
  'NOT_CONFIGURED'`) rather than building a second file-handling stack.
  Those modules were already written provider-agnostically (buffer in,
  `{storageKey, checksum}` out) for exactly this kind of reuse.
- **Append-only audit pattern**: mirrored `venue_cigar_inventory_events`
  (migration 106) with a new `venue_cigar_media_events` table — never
  updated or deleted.

## New schema — migration 114 (`114_smokecraft_venue_humidor_media.sql`)

| Table | Purpose |
|---|---|
| `venue_cigar_media_master_catalog` | Controlled, reusable cigar imagery keyed by brand/line/vitola/SKU, with its own approval/active state and rights record. |
| `venue_cigar_media_assets` | Per-venue product/venue image rows — scope, purpose, source classification, approval state, active state, primary flag, display order, focal point, alt text/caption, storage key, checksum. |
| `venue_cigar_media_events` | Append-only audit trail — one row per upload/import/approve/reject/assign/primary-change/ordering-change/metadata-edit/activate/retire/etc. |
| `venue_cigar_media_import_batches` | CSV dry-run/import batch results, row-level, for auditability and retry. |

## Invariants enforced at the database level (not just app code)

- `idx_vcma_one_primary_per_product` — a partial unique index on
  `(product_id) WHERE is_primary=true AND active_state='active' AND
  scope='product'` — makes "at most one active primary image per
  product" impossible to violate even by a future application bug.
- `idx_vcma_checksum_venue` — unique `(venue_id, checksum)` — duplicate
  uploads are rejected at the DB level, not just app-level.
- `chk_vcma_scope_product` — a `venue` scope row can never carry a
  `product_id`, and a `product` scope row can never be null on
  `product_id`.
- Foreign keys from `venue_cigar_media_assets.venue_id -> venues` and
  `.product_id -> venue_cigar_products` (`ON DELETE CASCADE`) and
  `.master_image_id -> venue_cigar_media_master_catalog` keep
  referential integrity venue-scoped.

Verified live against the real running Postgres instance
(`DATABASE_URL=crafthub_smokecraft_final`) — see `04-migration-result.txt`.

## Storage architecture

**Status: NOT_CONFIGURED (local-disk development fallback).** No
S3/GCS/Cloudinary credentials exist anywhere in this repo's env
config (audited, matches the pre-existing Package 6B finding this
pass reused rather than duplicated). `storageAdapter.js` is written
behind a stable interface (`upload`, `remove`, `readBuffer`,
`getControlledUrl`, `healthCheck`) so a real provider can be swapped
in without touching `mediaService.js` callers — every image URL
returned to clients is already a controlled, app-routed URL
(`/api/smokecraft/venue-humidor/media/asset/:assetId/file` or the
public equivalent under `/customer/...`), never a raw filesystem path,
and every file-serving route re-checks venue ownership (and, on the
public route, approval + active state) on every single request.

## Responsive delivery

`mediaService.js#buildResponsiveVariants()` returns width-bucketed
metadata (`thumbnail`/`browseCard`/`tablet`/`desktop`) with computed
height from the real stored aspect ratio, so every consuming screen has
a stable aspect-ratio container to avoid layout shift. Because there is
no real resize/transform pipeline in this dev fallback, all buckets
currently point at the same underlying file — the metadata contract
matches what a provider-transform URL scheme (e.g. Cloudinary
`w_400,c_fill`) would populate, so swapping in a real provider later is
metadata-compatible without a UI change.
