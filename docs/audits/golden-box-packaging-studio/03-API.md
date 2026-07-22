# API

Base: `/api/smokecraft/golden-box/packaging-studio`. All routes require `requireSmokeCraftIdentity` (server-verified guest-session JWT cookie or authenticated user session) except the shared-review read (token-scoped instead).

| Method | Path | Purpose |
|---|---|---|
| GET | /designs | List caller's own designs |
| POST | /designs | Create a new neutral design |
| GET | /designs/:designId | Read a design + current version (owner-only) |
| PATCH | /designs/:designId/draft | Save a new version from validated config |
| POST | /designs/:designId/duplicate | Duplicate a design |
| POST | /designs/:designId/archive | Archive |
| POST | /designs/:designId/restore | Restore from archive |
| DELETE | /designs/:designId | Soft-delete |
| GET | /designs/:designId/versions | List versions |
| GET | /designs/:designId/versions/:n | Read one version |
| POST | /designs/:designId/versions/:n/restore | Restore a version as a new version |
| POST | /designs/:designId/assets | Upload artwork (base64 JSON body, validated) |
| GET | /designs/:designId/assets/:assetId/file | Stream a private asset (owner-only) |
| DELETE | /assets/:assetId | Remove an asset |
| PUT | /assets/:assetId/placement | Set/update geometry |
| POST | /designs/:designId/shares | Create a share link |
| GET | /designs/:designId/shares | List shares |
| POST | /shares/:shareId/revoke | Revoke a share |
| GET | /shares/token/:shareToken | Read a shared design (token-scoped, no identity required) |
| POST | /shares/token/:shareToken/comments | Comment via a comment-enabled share (identity required for accountability) |
| GET | /designs/:designId/comments | List comments (owner-only) |
| POST | /designs/:designId/comments | Add a comment (owner or authorized collaborator) |
| POST | /comments/:commentId/resolve | Resolve a comment (owner-only) |
| POST | /designs/:designId/submit | Submit final packaging design |
| GET | /entries/:entryId/final-submission | Read the locked submitted snapshot (visibility-checked) |

## Error mapping

`sendError()` in the controller maps `PackagingStudioError` codes to HTTP status: not-found codes → 404, ownership/authorization codes → 403, lock/expiry/revocation conflicts → 409, all other validation failures → 400. This mirrors the status-code conventions already used across `goldenBoxController.js`.
