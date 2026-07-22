# Sharing and Comments

## Share tokens

`generateShareToken()` produces `crypto.randomBytes(32)` (256 bits of entropy), base64url-encoded. Only the SHA-256 hash is stored in `packaging_shares.share_token_hash`; the raw token is returned once at creation time and never persisted or logged. A partial UNIQUE index (`WHERE revoked_at IS NULL`) guarantees no two currently-active shares can hash-collide.

Two access types:
- **`view_only`** — read-only design snapshot, no comment endpoint accepts this share's identity.
- **`comment_enabled`** — same read access, plus `POST /shares/token/:shareToken/comments` accepts comments attributed to `author_share_id` (not a guest/user identity, preserving the reviewer's relative anonymity while still requiring a real server-verified guest/user session for accountability against comment spam).

Revocation (`revoked_at`) and expiration (`expires_at`) are both checked in `resolveShare()` on every access — a revoked or expired token immediately stops working, verified live for revocation.

## Comments

Comments attach to `design`, `surface`, `field`, `version`, or `artwork` targets via `target_type`/`target_ref`. Threading is supported via `parent_comment_id`. Only the design owner can resolve a comment (`resolveComment()` calls `requireOwnedDesign()`). Comment bodies pass through the same `sanitizeText()` unsafe-markup rejection as every other text field.

## Collaborators (schema-ready, not wired to a frontend invite screen this pass)

The `packaging_collaborators` table supports named, verified-identity collaborators with `viewer`/`commenter`/`mentor` roles, but this pass's real, tested collaboration path is tokenized share links (view-only / comment-enabled), not named collaborator invitations — disclosed in `00-FINAL-REPORT.md`. No collaborator write path exists that could alter the design; editing remains owner-only, matching the mandate's explicit constraint.
