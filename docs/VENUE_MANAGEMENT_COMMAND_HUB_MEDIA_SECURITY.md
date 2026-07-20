# Venue Management Command Hub — Media Security (Package 6B)

- **MIME allowlist by content, not extension/header claim**: magic bytes
  are sniffed directly (`imageValidation.sniffMimeFromBuffer`) — PNG,
  JPEG, WebP only. Anything else (including HTML/SVG/scripts disguised
  with an image extension) is rejected as `unsupported_mime_type`
  (live-verified: test #16, an `.html`-named payload containing
  `<script>` is rejected).
- **No SVG support** — SVGs can carry executable script content and no
  sanitizer exists in this repo, so SVG was excluded entirely rather than
  accepted-and-hoped-safe.
- **Size limit**: 5MB enforced in `imageValidation.js`; a defense-in-depth
  8MB Express body-size cap on the upload route rejects earlier with 413
  for grossly oversized payloads (live-verified: test #17).
- **Dimension bounds**: 32–6000px, parsed from real PNG IHDR / JPEG SOF /
  WebP VP8 headers, not trusted from client metadata.
- **Path traversal**: the object storage key is always server-generated
  (`crypto.randomUUID()`), the client-supplied filename is only used for
  a cosmetic, sanitized `normalizeFilename()` value — never as a
  filesystem path (live-verified: test #18, a `../../../etc/passwd`
  filename is accepted as *metadata* but has zero effect on where the
  file is written).
- **Cross-venue access**: every media read/write query includes
  `WHERE venue_id = $N` sourced from the authorization-validated
  `req.validatedVenue`, never a client-supplied value trusted alone
  (live-verified: test #19, #20).
- **No hard-delete while in use**: `archiveMedia` checks
  `checkMediaUsage` (branding slots + gallery) first and rejects with
  `media_in_use` (409) if assigned (live-verified: test #23).
- **Raw storage path never returned**: API responses expose only a
  controlled `/api/venue-management/.../file` URL, never
  `storage_path`/filesystem details (live-verified: test #26).

**Disclosed, not built this pass**: malware/antivirus scanning (no
scanning service exists anywhere in this codebase or sandbox to call).
