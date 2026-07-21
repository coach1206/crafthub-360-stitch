-- Collections Ownership and Persistence (controlled pass, after 086).
-- Additive only — does not touch migrations 075-086, does not alter
-- Filler Arrangement or Skill Tree data, does not create a competing
-- event log (smokecraft_progression_events is reused).
--
-- Audit finding: no existing structured, queryable collectible catalog
-- exists anywhere in this codebase. passport_360_badges (migration 068)
-- is a real table but keyed to a *different* identity system (guest_id
-- UUID -> passport_360_guest_profiles, a registered Passport account),
-- not the guest_reference TEXT scheme every smokecraft_* educational
-- table (seed_soil, filler_arrangement, skill_tree, progression_events)
-- uses for the ephemeral SmokeCraft guest-session identity this whole
-- track is built on. smokecraft_rewards/_reward_audit/_passport_rewards
-- (migration 029) are generic JSONB blobs, not a structured per-item
-- catalog. Nothing was duplicated -- this is genuinely new architecture,
-- built consistent with the guest_reference convention already
-- established by Skill Tree and Filler Arrangement.
--
-- Scope: 5 real collection items (not 7 — the approved artwork shows 7
-- category cards: Leaf, Cigar, Tool, Lounge, Knowledge, Badge, Reward/
-- Achievement, but only 5 currently have a legitimate, verifiable
-- backend earn condition. Tool Collection and Lounge Collection have no
-- backend evidence source anywhere in the codebase — no item was seeded
-- for either, rather than inventing a fake earn rule. Disclosed in the
-- final report, not hidden.

CREATE TABLE IF NOT EXISTS smokecraft_collection_items (
  id BIGSERIAL PRIMARY KEY,
  item_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  collection_category TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'badge',
  rarity TEXT,
  asset_reference TEXT,
  earn_condition TEXT NOT NULL,
  progression_event_type TEXT,
  source_module TEXT NOT NULL,
  source_record_type TEXT NOT NULL,
  xp_value INT NOT NULL DEFAULT 0,
  golden_box_relevance TEXT,
  merchandise_eligible BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  limited_edition BOOLEAN NOT NULL DEFAULT false,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS smokecraft_collection_ownership (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  collection_item_key TEXT NOT NULL REFERENCES smokecraft_collection_items(item_key) ON DELETE CASCADE,
  ownership_status TEXT NOT NULL DEFAULT 'earned' CHECK (ownership_status IN ('earned')),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  earn_source TEXT NOT NULL,
  source_progression_event_id BIGINT REFERENCES smokecraft_progression_events(id) ON DELETE SET NULL,
  source_record_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, collection_item_key)
);
CREATE INDEX IF NOT EXISTS idx_sco_guest ON smokecraft_collection_ownership (guest_reference);

-- Stable catalog definitions only — no learner ownership is seeded here.
INSERT INTO smokecraft_collection_items
  (item_key, display_name, description, collection_category, item_type, asset_reference, earn_condition, source_module, source_record_type, xp_value, golden_box_relevance, display_order)
VALUES
  ('filler-mastery-badge', 'Filler Arrangement Mastery', 'Awarded for completing the full Filler Arrangement standalone lesson — Ligero, Viso, Seco, and Volado placement, airflow, density, and combustion.', 'Leaf Collection', 'badge', 'session-visuals/filler%20arrangement.png', 'Complete the Filler Arrangement lesson', 'FillerArrangement', 'smokecraft_filler_arrangement_completion', 0, 'Filler arrangement directly affects Golden Box construction scoring.', 1),
  ('seed-soil-scholar-badge', 'Seed & Soil Scholar', 'Awarded for exploring seed genetics and soil types in the Seed & Soil experience.', 'Knowledge Collection', 'badge', 'SEED%20&%20SOIL.png', 'Explore at least one Seed & Soil component', 'SeedSoil', 'smokecraft_seed_soil_progress', 0, 'Understanding origin informs Golden Box seed/soil selection.', 2),
  ('master-roller-badge', 'Master Roller', 'Awarded for completing at least one real step of the rolling process — bunching, wrapper application, cap, or foot.', 'Cigar Collection', 'badge', 'leaf-construction/construct-cap.png', 'Complete at least one rolling-process step', 'WrapperStrength', 'smokecraft_rolling_progress', 0, 'Construction quality is a real Golden Box judging category.', 3),
  ('skill-tree-starter-badge', 'Skill Tree Starter', 'Awarded for completing the Foundation node of the SmokeCraft Skill Tree.', 'Badge Collection', 'badge', 'session-visuals/skill%20tree%201.png', 'Complete the Foundation Skill Tree node', 'SkillTree', 'smokecraft_skill_tree_learner_state', 0, NULL, 4),
  ('progression-pioneer-badge', 'Progression Pioneer', 'Awarded for engaging with at least two distinct SmokeCraft progression systems.', 'Reward / Achievement Collection', 'badge', 'session-visuals/collection%20center.png', 'Generate at least 2 distinct progression event types', 'ProgressionEvents', 'smokecraft_progression_events', 0, NULL, 5)
ON CONFLICT (item_key) DO NOTHING;
