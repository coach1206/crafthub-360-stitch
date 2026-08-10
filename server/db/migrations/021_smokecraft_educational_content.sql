-- Package 3: SmokeCraft educational content model + tobacco component
-- catalog. Additive only — does not modify migrations 075-078.
--
-- Governing decision (docs/audits/smokecraft-final-completion/package-3/
-- 01-KNOWLEDGE-DATA-AUDIT.md): golden_box_component_catalog already
-- exists (migration 077) as a correctly-shaped, empty catalog table.
-- Rather than create a duplicate smokecraft_components table, this
-- migration extends it additively with the real educational-impact
-- columns, and adds supporting tables for flavor taxonomy, component
-- compatibility, quiz hooks, media/hotspot readiness, versioning, and
-- audit — all referencing golden_box_component_catalog rather than
-- duplicating it.

-- ── Extend the existing catalog table (additive columns only) ───────
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS why_it_matters TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS quality_impact TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS flavor_impact TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS strength_impact TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS aroma_impact TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS burn_impact TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS construction_impact TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS performance_impact TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS decision_guidance TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS compatibility_notes TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS common_mistakes TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS mentor_guidance TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS related_session_id TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS media_asset_key TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS future_github_asset_path TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS selectable_in_blend BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS source_status TEXT NOT NULL DEFAULT 'curated_platform_content'
  CHECK (source_status IN ('curated_platform_content', 'database_backed', 'not_yet_available'));
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'reviewed'
  CHECK (review_status IN ('draft', 'in_review', 'reviewed', 'archived'));
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'published'
  CHECK (visibility IN ('draft', 'published', 'archived'));
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE golden_box_component_catalog ADD COLUMN IF NOT EXISTS created_by TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_gbcc_slug ON golden_box_component_catalog (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gbcc_category ON golden_box_component_catalog (category, subcategory);
CREATE INDEX IF NOT EXISTS idx_gbcc_visibility ON golden_box_component_catalog (visibility) WHERE visibility = 'published';

-- Version history — append-only snapshot per edit, same pattern as
-- venue_management_content_versions (Package 6A) and
-- golden_box_entry_versions (Package 1), reused rather than reinvented.
CREATE TABLE IF NOT EXISTS smokecraft_content_versions (
  id BIGSERIAL PRIMARY KEY,
  component_id BIGINT NOT NULL REFERENCES golden_box_component_catalog(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  payload JSONB NOT NULL,
  edited_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (component_id, version_number)
);

-- ── Media / hotspot readiness (Step 13 — image-integration readiness) ─
CREATE TABLE IF NOT EXISTS smokecraft_content_media (
  id BIGSERIAL PRIMARY KEY,
  component_id BIGINT REFERENCES golden_box_component_catalog(id) ON DELETE CASCADE,
  route TEXT,
  purpose TEXT NOT NULL,
  future_github_path TEXT NOT NULL,
  sc_assets_key TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT,
  orientation TEXT CHECK (orientation IN ('landscape', 'portrait', 'square')),
  responsive_crop_guidance TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  current_status TEXT NOT NULL DEFAULT 'USER_CREATING_IMAGE' CHECK (current_status IN ('USER_CREATING_IMAGE', 'UPLOADED', 'INTEGRATED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scm_component ON smokecraft_content_media (component_id);

CREATE TABLE IF NOT EXISTS smokecraft_hotspots (
  id BIGSERIAL PRIMARY KEY,
  media_id BIGINT NOT NULL REFERENCES smokecraft_content_media(id) ON DELETE CASCADE,
  component_id BIGINT REFERENCES golden_box_component_catalog(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  x_percent NUMERIC(5,2) NOT NULL CHECK (x_percent BETWEEN 0 AND 100),
  y_percent NUMERIC(5,2) NOT NULL CHECK (y_percent BETWEEN 0 AND 100),
  width_percent NUMERIC(5,2) NOT NULL CHECK (width_percent BETWEEN 0 AND 100),
  height_percent NUMERIC(5,2) NOT NULL CHECK (height_percent BETWEEN 0 AND 100),
  alt_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Flavor taxonomy (Step 6) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_flavor_notes (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  flavor_group TEXT NOT NULL CHECK (flavor_group IN (
    'earth', 'wood', 'spice', 'sweet', 'nut', 'cream', 'coffee', 'cocoa',
    'leather', 'herbal', 'floral', 'fruit', 'citrus', 'mineral', 'roasted', 'pepper'
  )),
  parent_id BIGINT REFERENCES smokecraft_flavor_notes(id) ON DELETE SET NULL,
  definition TEXT NOT NULL,
  common_descriptors TEXT,
  typical_tobacco_associations TEXT,
  strength_perception TEXT,
  aroma_relationship TEXT,
  compatibility_notes TEXT,
  pairing_considerations TEXT,
  common_learner_confusion TEXT,
  related_session_id TEXT,
  golden_box_use TEXT,
  media_asset_key TEXT,
  future_github_asset_path TEXT,
  visibility TEXT NOT NULL DEFAULT 'published' CHECK (visibility IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scfn_group ON smokecraft_flavor_notes (flavor_group);

-- ── Component compatibility (Step 7 — decision support, not formulas) ─
CREATE TABLE IF NOT EXISTS smokecraft_component_compatibility (
  id BIGSERIAL PRIMARY KEY,
  source_component_id BIGINT NOT NULL REFERENCES golden_box_component_catalog(id) ON DELETE CASCADE,
  target_component_id BIGINT NOT NULL REFERENCES golden_box_component_catalog(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'complements', 'contrasts', 'balances', 'may_overpower', 'may_weaken_combustion',
    'may_improve_burn', 'may_increase_strength', 'may_soften_strength',
    'may_increase_sweetness', 'may_add_spice', 'may_add_body', 'may_affect_draw',
    'requires_careful_ratio', 'depends_on_processing', 'depends_on_vitola'
  )),
  strength TEXT CHECK (strength IN ('mild', 'moderate', 'strong')),
  explanation TEXT NOT NULL,
  decision_guidance TEXT,
  mentor_note TEXT,
  evidence_status TEXT NOT NULL DEFAULT 'curated_platform_content' CHECK (evidence_status IN ('curated_platform_content', 'reviewed', 'unverified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (source_component_id != target_component_id)
);
CREATE INDEX IF NOT EXISTS idx_sccc_source ON smokecraft_component_compatibility (source_component_id);
CREATE INDEX IF NOT EXISTS idx_sccc_target ON smokecraft_component_compatibility (target_component_id);

-- ── Quiz hooks (Step 11) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_quiz_questions (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer_choices JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  related_component_id BIGINT REFERENCES golden_box_component_catalog(id) ON DELETE SET NULL,
  related_session_id TEXT,
  xp_award_rule_key TEXT REFERENCES xp_award_rules(rule_key) ON DELETE SET NULL,
  attempt_rules JSONB NOT NULL DEFAULT '{"maxAttempts": null, "allowRetry": true}',
  review_status TEXT NOT NULL DEFAULT 'reviewed' CHECK (review_status IN ('draft', 'in_review', 'reviewed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scqq_component ON smokecraft_quiz_questions (related_component_id);

-- ── Content audit log (append-only, mirrors golden_box_activity_log) ─
CREATE TABLE IF NOT EXISTS smokecraft_content_audit_log (
  id BIGSERIAL PRIMARY KEY,
  component_id BIGINT REFERENCES golden_box_component_catalog(id) ON DELETE SET NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION smokecraft_content_audit_no_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'smokecraft_content_audit_log rows cannot be deleted';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_scal_no_delete ON smokecraft_content_audit_log;
CREATE TRIGGER trg_scal_no_delete
  BEFORE DELETE ON smokecraft_content_audit_log
  FOR EACH ROW EXECUTE FUNCTION smokecraft_content_audit_no_delete();

-- ── Audit category extension (reuses GOLDEN_BOX, already added in 077) ─
-- No change needed — content management actions use the existing
-- 'GOLDEN_BOX' audit_logs category.
