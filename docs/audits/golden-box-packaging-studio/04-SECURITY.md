# Security

All items below are verified live by `verify-golden-box-packaging-studio.mjs` unless noted.

- **Unauthenticated access rejected** — every mutating and most reading routes require `requireSmokeCraftIdentity`.
- **Owner-only edits** — `requireOwnedDesign()` gates draft save, duplicate, archive, restore, soft-delete, asset upload/placement/removal, share creation/listing, comment listing.
- **Cross-learner rejection** — verified for design read/write, share management.
- **Forged owner rejection** — identity is always server-derived (`identityFrom(req)`), never read from `req.body`.
- **Unsafe text/markup rejected** — `sanitizeText()` rejects any `<`/`>` character outright (no tag allowlist to bypass) and enforces length limits per field.
- **Unsafe file rejected** — reuses `imageValidation.validateImageBuffer()` (magic-byte MIME sniffing, not client-supplied content-type; PNG/JPEG/WebP only; no SVG/HTML/executable recognition).
- **Oversized upload rejected** — enforced at two layers: the global Express JSON body limit (1MB) rejects large payloads with 413 before reaching the controller; the service's own `MAX_UPLOAD_BYTES` (8MB, matching venue-management's `MAX_BYTES`) is a secondary check.
- **Path traversal rejected** — asset `stored_filename` is always a server-generated UUID (`storage.upload()`), never derived from the client-supplied original filename; `asset_type` is a fixed enum, not a free-text path segment.
- **Predictable share token not used** — `crypto.randomBytes(32)`, base64url-encoded, hashed (SHA-256) before storage; the raw token is returned once and never persisted.
- **Share-token revocation and expiration** — enforced in `resolveShare()`, verified live for revocation; expiration verified via source (the same code path checks `expires_at < now()`).
- **Comments cannot inject scripts** — same `sanitizeText()` markup rejection applied to comment bodies.
- **View-only share cannot comment; comment-enabled share can, scoped to that one design** — verified live.
- **Historical version cannot be edited** — no update path exists for `packaging_design_versions`; every "restore" creates a new row.
- **Submitted snapshot cannot be silently replaced** — `packaging_final_submissions.UNIQUE(entry_id)` + idempotent `ON CONFLICT DO NOTHING`; the design itself locks to `status = 'submitted'` and rejects further draft edits.
- **LocalStorage cannot override owner identity** — identity resolution never reads any client-writable storage; it comes exclusively from the signed JWT cookie verified server-side.

## Defect found and fixed

See `00-FINAL-REPORT.md` and `10-REGRESSION-MATRIX.md` — `handleGetFinalSubmission` initially lacked any authorization check; fixed by reusing `visibilityService.getVisibility()`.
