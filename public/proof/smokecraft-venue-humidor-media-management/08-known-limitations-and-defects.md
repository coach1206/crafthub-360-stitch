# Known Limitations and Defects

## Defect handling

No genuinely proven pre-existing runtime defect was found and left
unfixed during this pass, so no `SC-D069` is assigned. Highest current
defects remain `SC-D068`/`SC-D068b` (carried forward, unrelated to
this pass, not touched).

One implementation bug was found and fixed **before commit** (not a
qualifying pre-existing defect — an authoring mistake in this pass's
own new code, caught by this pass's own test suite):
`assertProductBelongsToVenue()` initially let a malformed/foreign
`productId` reach the database query directly, producing a raw
Postgres `invalid input syntax for type uuid` error (mapped to a 500)
instead of the intended `invalid_product_assignment` (422). Fixed by
validating UUID shape before querying. Caught by
`verify-smokecraft-venue-humidor-media-1-api.mjs` §3 before the
initial commit — no defect number assigned per the mandate's own
"mistakes you catch and fix before committing" carve-out.

A second bug was found and fixed the same way: the controlled asset
file-serving URL builder (`assetUrl()`) initially omitted the
`venues/:venueId/` path segment required by the actual mounted route,
so every rendered `<img>` in the admin gallery and public browse pages
404'd. Fixed by threading `venueId` through the URL builder and adding
a separate `publicAssetUrl()` for the customer-facing route. Caught by
the browser test's console-error capture
(`screenshots/console-errors.json`) before the initial commit — same
"caught before commit" carve-out, no defect number assigned.

## Known limitations (real, disclosed)

1. **Storage provider is the local-disk dev fallback, not production
   storage.** No S3/GCS/Cloudinary credentials exist in this repo's
   env config. `STORAGE_PROVIDER_STATUS = 'NOT_CONFIGURED'`. The
   provider-adapter interface (`upload`/`remove`/`readBuffer`/
   `getControlledUrl`/`healthCheck`) is written so a real provider can
   be swapped in without touching `mediaService.js` callers, but this
   is explicitly NOT production-ready storage as shipped.
2. **Responsive delivery variants share one underlying file.** No real
   image-resize/transform pipeline exists in this repo (audited: no
   `sharp`/`multer`/provider-transform library). `buildResponsiveVariants()`
   returns correct width/height *metadata* for thumbnail/browseCard/
   tablet/desktop buckets (so consuming UI can reserve a stable
   aspect-ratio box and avoid layout shift), but all buckets currently
   resolve to the same full-resolution file rather than a genuinely
   resized asset. Metadata contract is provider-transform-compatible for a
   future swap.
3. **Master catalog** — `listMasterCatalog()`, the brand-mismatch
   rejection path, and a real end-to-end "assign a matching, approved
   master-catalog image to a real product" call were all exercised
   live directly against `mediaService.js` (a seeded master-catalog row
   was inserted and successfully assigned to a matching-brand product,
   producing a real `venue_cigar_media_assets` row with
   `source_type='smokecraft_master_catalog'`). No licensed manufacturer
   imagery was available to seed the catalog through the HTTP upload
   endpoint in this sandbox, so this path was proven at the service
   layer rather than through the HTTP API test suite — documented here
   for transparency, not hidden.
4. **Manufacturer/distributor URL import's successful download path
   was not exercised against a real remote host.** The allowlist/SSRF
   guard, rights-reference requirement, and CSV dry-run validation are
   all proven live; the actual "fetch bytes from an authorized
   manufacturer host and store them" step reuses the already-proven
   `uploadAsset()` code path but no real authorized-media host exists
   in this sandbox to fetch from.
5. **App-wide 1MB JSON body-parser limit sits below the 5MB
   image-validator limit** for this pass's base64-in-JSON upload
   transport (pre-existing app-wide config, not introduced by this
   pass) — see `06-rbac-and-security.md`.
6. **Carried-forward, out of scope this pass** (per the mandate):
   mobile/tablet letterboxing pattern and Golden Box Rules text
   overlap, found during the prior Final Gameplay Acceptance pass.
   This pass's changes do not touch either surface and did not worsen
   either — see `09-regression-results.md`.
7. **Admin media screen is intentionally minimal this pass.** It
   covers upload, preview, metadata entry, product assignment (via
   venue/product ID fields, not a product picker widget), approval,
   rejection, primary selection, retirement, and the missing-image
   report — all live and backend-wired. It does not yet include a
   drag-to-reorder gallery UI (reordering is implemented and tested at
   the API level, `03-api-test-results.txt` §6, but the admin screen
   does not expose a reorder control), a CSV-import UI (the CSV
   endpoints are implemented and tested at the API level only), or a
   master-catalog browse/assign UI. These are natural, scoped-down
   breadth cuts for a Production Package 1 of 7 pass, not realness
   cuts — every listed gap is a real, disclosed gap, not a fabricated
   pass.
