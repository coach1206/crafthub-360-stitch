# Fallback System, Master Catalog, Manufacturer/Distributor Imports, CSV Import

## Fallback chain

`mediaService.getPublicProductMedia()` → `resolveFallback()`:

1. Approved + active product gallery (primary first, then display order).
2. Approved + active venue-level `error_fallback`-purpose asset.
3. Approved + active master-catalog image matching the product's real
   `brand`/`product_line`/`vitola`.
4. SmokeCraft branded placeholder SVG (`public/assets/venue-humidor/branded-placeholder.svg`).

Every step matches on real product identity (`brand`) before ever
returning a master-catalog image — a product can never receive an
unrelated cigar's photo. Proven live: a product with zero uploaded
media resolves to the branded placeholder (`03-api-test-results.txt`
§11, `05-browser-test-results.txt` "Fallback: no-image product
resolves to the branded SmokeCraft placeholder, never an unrelated
cigar image").

## Master catalog

`venue_cigar_media_master_catalog` — brand/line/vitola/SKU-keyed,
independently approved/active. `assignMasterToProduct()` refuses to
assign a master image whose `brand` does not match the target
product's real `brand` (`master_image_product_mismatch`, 422) — venue
staff cannot arbitrarily assign an unrelated master image. No seed
rows were loaded into the master catalog in this pass (no manufacturer
imagery was available to seed with real, licensed content) — the
listing/assignment code paths are implemented and unit-level correct
via the mismatch-rejection test, but end-to-end "assign a real,
seeded master image" was not exercised live this pass. Documented as
a known limitation below.

## Manufacturer/distributor URL import

`importFromUrl()` — HTTPS-only, allowlisted domain
(`IMPORT_DOMAIN_ALLOWLIST`, configurable via
`VENUE_HUMIDOR_MEDIA_IMPORT_ALLOWLIST`), server-side `fetch()` with
`redirect: 'error'` (never follows an off-allowlist redirect), requires
a non-empty `rightsReference` for `manufacturer_authorized`/
`distributor_authorized` source types. Proven live:
- Disallowed domain rejected (422, SSRF guard) — §8.
- Missing rights reference rejected (422) — §8.
No actual authorized-media domain exists in this sandbox to fetch a
real remote file from, so the *successful* import path is exercised
only through the CSV dry-run/import machinery below (which shares the
same `importFromUrl()` function) rather than a bare successful
`import-url` call in this pass — documented as a known limitation.

## CSV import

Fields (per mandate): `venue_id,cigar_id,sku,barcode,brand,line,vitola,
image_url,image_purpose,source_type,source_name,rights_reference,
alt_text,primary,display_order`.

- **Dry-run** validates every row (required fields, venue isolation,
  purpose/source-type enum membership, product existence, SKU match)
  without writing anything — proven live, a valid row returns
  `status: 'valid'` with zero side effects (§9).
- **Row-level errors, never partial silent corruption**: a batch with
  one SKU-mismatch row and one cross-venue row reports exactly 2
  `errorRows` with per-row error codes (`sku_mismatch`,
  `venue_isolation_violation`) — proven live (§9).
- Every dry-run/import call writes a `venue_cigar_media_import_batches`
  row (`batch_id`, `mode`, `total_rows`, `success_rows`, `error_rows`,
  full `row_results` JSON) and a `venue_cigar_media_events` audit row —
  the import summary/audit record required by the mandate.
- Live CSV *import* (non-dry-run) that actually downloads a file was
  not exercised end-to-end in this pass for the same "no real
  allowlisted media host reachable in this sandbox" reason as URL
  import above — the dry-run path (validation, row errors, venue
  isolation, product-match verification, batch summary/audit) is fully
  proven live; the download-and-store step reuses the already-proven
  `importFromUrl()`/`uploadAsset()` code path.
