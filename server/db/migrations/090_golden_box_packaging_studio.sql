-- Golden Box Packaging Studio — physical packaging design tool for a
-- learner's Golden Box entry. Reuses (not duplicated): golden_box_entries
-- (competition-entry association, ownership pattern), the
-- guest_reference/user_id identity convention used throughout SmokeCraft,
-- audit_logs (GOLDEN_BOX category, already added in migration 077).

CREATE TABLE IF NOT EXISTS packaging_designs (
  id BIGSERIAL PRIMARY KEY,
  design_id UUID NOT NULL DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES golden_box_entries (entry_id) ON DELETE SET NULL,
  user_id TEXT,
  guest_reference TEXT,
  box_name TEXT,
  subtitle TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'archived', 'submitted')),
  current_version INTEGER NOT NULL DEFAULT 0,
  design_notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_pkg_design_identity CHECK (user_id IS NOT NULL OR guest_reference IS NOT NULL),
  CONSTRAINT uq_pkg_design_id UNIQUE (design_id)
);
CREATE INDEX IF NOT EXISTS idx_pkg_designs_owner_user ON packaging_designs (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pkg_designs_owner_guest ON packaging_designs (guest_reference) WHERE guest_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pkg_designs_entry ON packaging_designs (entry_id);

-- Each save creates a new immutable version row — same "never mutate a
-- prior snapshot" pattern already proven for golden_box_entry_versions.
CREATE TABLE IF NOT EXISTS packaging_design_versions (
  id BIGSERIAL PRIMARY KEY,
  design_id UUID NOT NULL REFERENCES packaging_designs (design_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  parent_version_number INTEGER,
  change_note TEXT,
  created_by TEXT,
  -- Structured configuration snapshot (box_name, wood, exterior_color,
  -- finish, lid_style, closure, interior_lining, tray_configuration,
  -- cigar_capacity, dimensions, engraving, printed_text, notes) — a
  -- single JSONB snapshot column matches the entry_version_id.
  -- predicted_profile / presentation_payload JSONB-snapshot pattern
  -- already established for Golden Box entries.
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_pkg_version_number UNIQUE (design_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_pkg_versions_design ON packaging_design_versions (design_id);

CREATE TABLE IF NOT EXISTS packaging_assets (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES packaging_designs (design_id) ON DELETE CASCADE,
  uploaded_by_user_id TEXT,
  uploaded_by_guest_reference TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'lid_artwork', 'side_artwork', 'interior_artwork', 'pattern_overlay')),
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  preview_filename TEXT,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  width_px INTEGER,
  height_px INTEGER,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_pkg_asset_id UNIQUE (asset_id)
);
CREATE INDEX IF NOT EXISTS idx_pkg_assets_design ON packaging_assets (design_id);

CREATE TABLE IF NOT EXISTS packaging_asset_placements (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES packaging_assets (asset_id) ON DELETE CASCADE,
  surface TEXT NOT NULL CHECK (surface IN ('lid_top', 'front', 'left_side', 'right_side', 'interior_lid', 'interior_tray')),
  x_position NUMERIC(6, 4) NOT NULL DEFAULT 0.5 CHECK (x_position >= 0 AND x_position <= 1),
  y_position NUMERIC(6, 4) NOT NULL DEFAULT 0.5 CHECK (y_position >= 0 AND y_position <= 1),
  width NUMERIC(6, 4) NOT NULL DEFAULT 0.3 CHECK (width > 0 AND width <= 1),
  height NUMERIC(6, 4) NOT NULL DEFAULT 0.3 CHECK (height > 0 AND height <= 1),
  rotation_degrees NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (rotation_degrees >= -45 AND rotation_degrees <= 45),
  scale NUMERIC(4, 3) NOT NULL DEFAULT 1.0 CHECK (scale >= 0.1 AND scale <= 3.0),
  layer_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Geometry must stay on the box surface: a centered position plus
  -- half-width/half-height may not exceed the [0,1] normalized surface.
  CONSTRAINT chk_pkg_placement_bounds CHECK (
    (x_position - width / 2) >= -0.001 AND (x_position + width / 2) <= 1.001 AND
    (y_position - height / 2) >= -0.001 AND (y_position + height / 2) <= 1.001
  )
);
CREATE INDEX IF NOT EXISTS idx_pkg_placements_asset ON packaging_asset_placements (asset_id);

CREATE TABLE IF NOT EXISTS packaging_shares (
  id BIGSERIAL PRIMARY KEY,
  design_id UUID NOT NULL REFERENCES packaging_designs (design_id) ON DELETE CASCADE,
  share_token_hash TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view_only', 'comment_enabled')),
  created_by_user_id TEXT,
  created_by_guest_reference TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pkg_share_active_token ON packaging_shares (share_token_hash) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pkg_shares_design ON packaging_shares (design_id);

CREATE TABLE IF NOT EXISTS packaging_collaborators (
  id BIGSERIAL PRIMARY KEY,
  design_id UUID NOT NULL REFERENCES packaging_designs (design_id) ON DELETE CASCADE,
  share_id BIGINT REFERENCES packaging_shares (id) ON DELETE SET NULL,
  collaborator_user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'commenter', 'mentor')),
  invited_by_user_id TEXT,
  invited_by_guest_reference TEXT,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_pkg_collaborator UNIQUE (design_id, collaborator_user_id)
);
CREATE INDEX IF NOT EXISTS idx_pkg_collaborators_design ON packaging_collaborators (design_id);

CREATE TABLE IF NOT EXISTS packaging_comments (
  id BIGSERIAL PRIMARY KEY,
  design_id UUID NOT NULL REFERENCES packaging_designs (design_id) ON DELETE CASCADE,
  version_number INTEGER,
  target_type TEXT NOT NULL DEFAULT 'design' CHECK (target_type IN ('design', 'surface', 'field', 'version', 'artwork')),
  target_ref TEXT,
  parent_comment_id BIGINT REFERENCES packaging_comments (id) ON DELETE CASCADE,
  author_user_id TEXT,
  author_guest_reference TEXT,
  author_share_id BIGINT REFERENCES packaging_shares (id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_pkg_comment_author CHECK (author_user_id IS NOT NULL OR author_guest_reference IS NOT NULL OR author_share_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_pkg_comments_design ON packaging_comments (design_id);

CREATE TABLE IF NOT EXISTS packaging_final_submissions (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES golden_box_entries (entry_id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES packaging_designs (design_id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  submitted_by_user_id TEXT,
  submitted_by_guest_reference TEXT,
  idempotency_key TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_pkg_final_submission_entry UNIQUE (entry_id),
  CONSTRAINT uq_pkg_final_submission_idempotency UNIQUE (idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_pkg_final_submissions_design ON packaging_final_submissions (design_id);

-- Append-only, same pattern as golden_box_activity_log.
CREATE TABLE IF NOT EXISTS packaging_audit_events (
  id BIGSERIAL PRIMARY KEY,
  design_id UUID REFERENCES packaging_designs (design_id) ON DELETE SET NULL,
  actor_user_id TEXT,
  actor_guest_reference TEXT,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pkg_audit_design ON packaging_audit_events (design_id);

CREATE OR REPLACE FUNCTION packaging_audit_events_no_delete_or_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'packaging_audit_events rows are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_packaging_audit_no_delete ON packaging_audit_events;
CREATE TRIGGER trg_packaging_audit_no_delete
  BEFORE DELETE OR UPDATE ON packaging_audit_events
  FOR EACH ROW EXECUTE FUNCTION packaging_audit_events_no_delete_or_update();
