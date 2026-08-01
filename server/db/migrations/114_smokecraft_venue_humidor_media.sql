-- Venue Humidor Media and Product Image Management — Production
-- Package 1 of 7. Additive only. Reuses venue_cigar_products (106) and
-- the venues/venue_memberships RBAC model (010) — no parallel product,
-- venue, or identity concept invented. Mirrors the append-only
-- inventory-ledger pattern already used by venue_cigar_inventory_events.

-- ── Master catalog: controlled, reusable cigar imagery keyed by
-- brand/line/vitola/SKU. Venue staff may only assign a master image
-- that matches the real product (enforced in mediaService.js).
CREATE TABLE IF NOT EXISTS venue_cigar_media_master_catalog (
  id                BIGSERIAL PRIMARY KEY,
  master_image_id   UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  brand             TEXT NOT NULL,
  line              TEXT,
  vitola            TEXT,
  sku               TEXT,
  storage_provider  TEXT NOT NULL DEFAULT 'local_dev_disk',
  storage_key       TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  width             INTEGER NOT NULL,
  height            INTEGER NOT NULL,
  size_bytes        INTEGER NOT NULL,
  checksum          TEXT NOT NULL,
  source_type       TEXT NOT NULL CHECK (source_type IN (
    'manufacturer_authorized','distributor_authorized','smokecraft_master_catalog'
  )),
  source_name       TEXT,
  source_url        TEXT,
  rights_reference  TEXT,
  approval_state    TEXT NOT NULL DEFAULT 'pending_review' CHECK (approval_state IN (
    'pending_review','approved','rejected'
  )),
  active_state      TEXT NOT NULL DEFAULT 'active' CHECK (active_state IN ('active','retired')),
  approved_by       TEXT,
  approved_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_by        TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcmmc_brand_line_vitola ON venue_cigar_media_master_catalog (brand, line, vitola);
CREATE INDEX IF NOT EXISTS idx_vcmmc_sku ON venue_cigar_media_master_catalog (sku);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcmmc_checksum ON venue_cigar_media_master_catalog (checksum);

-- ── Per-venue product/venue image assets. One row per uploaded/
-- imported asset; purpose/source/approval/active state travel with the
-- row so nothing is ever silently mixed across classifications.
CREATE TABLE IF NOT EXISTS venue_cigar_media_assets (
  id                    BIGSERIAL PRIMARY KEY,
  asset_id              UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id              TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  product_id            UUID REFERENCES venue_cigar_products(product_id) ON DELETE CASCADE,
  master_image_id       UUID REFERENCES venue_cigar_media_master_catalog(master_image_id),
  scope                 TEXT NOT NULL CHECK (scope IN ('product', 'venue')),
  purpose               TEXT NOT NULL CHECK (purpose IN (
    'product_primary','product_gallery','product_thumbnail','inventory_table','browse_card',
    'detail_hero','recommendation','pairing','passport_acquisition','fulfillment','receipt',
    'venue_hero','venue_gallery','empty_state','error_fallback','investor_demo'
  )),
  source_type           TEXT NOT NULL CHECK (source_type IN (
    'venue_uploaded_photography','venue_uploaded_venue_photography','manufacturer_authorized',
    'distributor_authorized','smokecraft_master_catalog','educational_graphic','branded_placeholder',
    'generated_ui_overlay'
  )),
  source_name           TEXT,
  source_url            TEXT,
  rights_reference       TEXT,
  storage_provider       TEXT NOT NULL DEFAULT 'local_dev_disk',
  storage_key            TEXT NOT NULL,
  original_filename       TEXT NOT NULL,
  normalized_filename     TEXT NOT NULL,
  mime_type              TEXT NOT NULL,
  width                  INTEGER NOT NULL,
  height                 INTEGER NOT NULL,
  size_bytes             INTEGER NOT NULL,
  checksum               TEXT NOT NULL,
  alt_text               TEXT,
  caption                TEXT,
  focal_point_x           NUMERIC(4,3) DEFAULT 0.5,
  focal_point_y           NUMERIC(4,3) DEFAULT 0.5,
  display_order           INTEGER NOT NULL DEFAULT 0,
  is_primary             BOOLEAN NOT NULL DEFAULT false,
  approval_state          TEXT NOT NULL DEFAULT 'pending_review' CHECK (approval_state IN (
    'uploaded','processing','pending_review','approved','rejected','failed'
  )),
  active_state            TEXT NOT NULL DEFAULT 'inactive' CHECK (active_state IN (
    'active','inactive','retired'
  )),
  rejection_reason        TEXT,
  retirement_reason        TEXT,
  review_date              DATE,
  notes                   TEXT,
  created_by              TEXT NOT NULL,
  approved_by             TEXT,
  approved_at              TIMESTAMPTZ,
  retired_by               TEXT,
  retired_at                TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_vcma_scope_product CHECK (
    (scope = 'product' AND product_id IS NOT NULL) OR (scope = 'venue' AND product_id IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_vcma_venue ON venue_cigar_media_assets (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcma_product ON venue_cigar_media_assets (product_id);
CREATE INDEX IF NOT EXISTS idx_vcma_venue_purpose ON venue_cigar_media_assets (venue_id, purpose);
CREATE INDEX IF NOT EXISTS idx_vcma_public ON venue_cigar_media_assets (venue_id, approval_state, active_state);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcma_checksum_venue ON venue_cigar_media_assets (venue_id, checksum);
-- Exactly one active, approved primary image per product — DB-enforced.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcma_one_primary_per_product
  ON venue_cigar_media_assets (product_id)
  WHERE is_primary = true AND active_state = 'active' AND scope = 'product';

-- ── Append-only audit trail. Never updated or deleted, matching
-- venue_cigar_inventory_events (migration 106).
CREATE TABLE IF NOT EXISTS venue_cigar_media_events (
  id                BIGSERIAL PRIMARY KEY,
  event_id          UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id          TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  asset_id          UUID,
  product_id        UUID,
  action            TEXT NOT NULL CHECK (action IN (
    'upload','import','approve','reject','assign','primary_change','ordering_change',
    'metadata_edit','activate','retire','restore','deletion_request','provider_failure'
  )),
  actor_id          TEXT NOT NULL,
  actor_role        TEXT,
  before_summary    JSONB,
  after_summary     JSONB,
  correlation_id    TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcme_venue ON venue_cigar_media_events (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcme_asset ON venue_cigar_media_events (asset_id);
CREATE INDEX IF NOT EXISTS idx_vcme_correlation ON venue_cigar_media_events (correlation_id);

-- ── CSV import batches (manifest imports) — row-level results, never
-- partial silent corruption.
CREATE TABLE IF NOT EXISTS venue_cigar_media_import_batches (
  id                BIGSERIAL PRIMARY KEY,
  batch_id          UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id          TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  mode              TEXT NOT NULL CHECK (mode IN ('dry_run','import')),
  status            TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','failed')),
  total_rows        INTEGER NOT NULL DEFAULT 0,
  success_rows      INTEGER NOT NULL DEFAULT 0,
  error_rows        INTEGER NOT NULL DEFAULT 0,
  row_results       JSONB NOT NULL DEFAULT '[]',
  created_by        TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcmib_venue ON venue_cigar_media_import_batches (venue_id);
