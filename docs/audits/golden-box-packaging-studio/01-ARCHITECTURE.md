# Architecture

## Layers

- **Frontend:** `src/pages/smokecraft/goldenBox/PackagingStudio{Dashboard,Editor,Versions,Share}.jsx` + `PackagingReview.jsx` (shared-token view), all lazy-loaded from `src/App.jsx` under `/smokecraft/golden-box/packaging-studio/*` and `/smokecraft/golden-box/packaging-review/:shareToken`.
- **API client:** `src/services/goldenBox/packagingStudioApiClient.js` — same `{ok,status,error}` normalized-fetch pattern as `goldenBoxApiClient.js`.
- **Routes:** `server/routes/packagingStudioRoutes.js` — 26 endpoints, mounted at `/api/smokecraft/golden-box/packaging-studio`, reusing the existing `attachSmokeCraftIdentity`/`requireSmokeCraftIdentity` guest-identity middleware (same JWT-signed HttpOnly cookie architecture as every other SmokeCraft module).
- **Controller:** `server/controllers/packagingStudioController.js` — thin dispatcher, derives identity server-side (`identityFrom(req)`, never from `req.body`), maps service error codes to HTTP status.
- **Service:** `server/services/goldenBox/packagingStudioService.js` — all validation, persistence, and business rules.
- **Storage:** reuses `server/services/venueManagement/storageAdapter.js` (local-disk dev adapter) and `imageValidation.js` (magic-byte MIME sniffing, dimension parsing) — no new upload/storage mechanism invented.

## Identity and ownership

Every write path derives the caller's identity from the server-verified guest-session JWT (or authenticated user session) via `identityFrom(req)` — never from a request body field. Ownership is checked by comparing `identity.userId`/`identity.guestReference` against the design's stored `user_id`/`guest_reference` columns (`ownsDesign()` in the service), the same pattern already proven in `visibilityService.resolveViewerRole()` for Golden Box entries.

## Immutability pattern

Design edits never mutate a row in place — each save inserts a new `packaging_design_versions` row and marks it `is_current`, exactly mirroring the `golden_box_entry_versions` pattern already used for blend entries. Final submission snapshots a version into `packaging_final_submissions`, a separate, `UNIQUE(entry_id)`-constrained table — the submitted record is structurally independent of the design's ongoing edit history.

## Why no new identity/storage/audit mechanism was invented

Per the mandate's own instruction ("use existing repository storage architecture where available") and this operation's consistent pattern across every prior pass, the Packaging Studio reuses: the SmokeCraft guest-identity middleware, the Golden Box entry-ownership comparison pattern, the venue-management image-validation/storage adapter, and the `audit_logs`/append-only-trigger pattern (via a new `packaging_audit_events` table using the identical `..._no_delete_or_update` trigger already proven for `golden_box_activity_log` and `xp_transactions`).
