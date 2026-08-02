# Object Storage Protection Plan — Production Package 5

Builds on Package 4's R2/S3 storage adapter and Package 1's Venue Humidor media management. No live bucket exists in this sandbox — this is the protection PLAN plus what could be verified locally (media/asset mapping tables survive a DB restore, verified in `restore-test.md`).

## Scope
- Originals must be protected (irreplaceable — uploaded by venues).
- Generated variants (Sharp pipeline output, Package 4) are reproducible from originals + a manifest of resize parameters — lower protection priority, documented as such rather than backed up 1:1.
- Rights metadata, asset mappings, retirement history live in Postgres (`venue_cigar_media_assets`, `venue_cigar_media_events`, `venue_cigar_media_master_catalog`, `smokecraft_content_media`, `packaging_assets`) — these ARE covered by the real database backup/restore this pass proved (see `restore-test.md`, check "media/asset mapping table(s) present post-restore" — PASS).

## Plan (documented — provider-dependent, not exercised without a live bucket)
- **Versioning**: enable bucket versioning so an overwrite/accidental-delete of an original is recoverable via a prior version, not just a backup cycle.
- **Lifecycle policy**: originals — never auto-expire. Generated variants — may be pruned/regenerated on demand since they're reproducible from the original + resize manifest.
- **Accidental-deletion protection**: enable MFA-delete or object lock on the originals prefix once a live bucket exists.
- **Provider replication/export**: cross-region replication (R2/S3 native) for originals; periodic (weekly) export of the originals prefix to a second bucket/provider as a belt-and-suspenders measure against a single-provider outage.
- **Manifest backup**: the asset-mapping tables above are included in every `pg_dump` database backup — so "what original maps to what venue/product/rights-holder" survives independently of the bucket's own durability.
- **Checksum verification**: `server/lib/structuredLogger.mjs`'s pattern of computing sha256 (as used for DB backup artifacts in this pass) should be applied to media uploads too — Package 4's Sharp pipeline is the natural integration point; recommended as a near-term follow-up, not yet wired to the media upload path this pass (scope discipline: this pass focused on database backup/restore as the primary REAL proof per the mandate).
- **No cross-environment restore confusion**: same principle as the DB restore validator — any media restore procedure must target a scratch/staging prefix, never overwrite production media in place without a dry-run diff first.

## Honesty statement
No live object-storage bucket was created, written to, or restored from in this sandbox. What was verified for real: the metadata tables that describe media assets survive a full database backup/restore cycle intact (proof: `restore-test.md`).
