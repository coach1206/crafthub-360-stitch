-- Challenge Hub Live State and Persistence (controlled pass, after 087).
-- Additive only — does not touch migrations 075-087, does not alter
-- Filler Arrangement, Skill Tree, or Collections data, does not create a
-- competing event log (smokecraft_progression_events is reused).
--
-- Audit finding: ChallengeHub.jsx was a fully static, local-only shell —
-- one hard-coded challenge card (Blend Fault Identification) linking to
-- a route with no backend connection at all, an honest "not yet backend-
-- connected" disclosure for streaks/XP/countdowns, and no fake streak or
-- leaderboard data to remove (none existed). No existing challenge,
-- assignment, submission, or schedule table exists anywhere in the
-- codebase (golden_box_rounds/_submissions are Golden-Box-specific, not
-- reused here per the Golden Box boundary rule). This is genuinely new
-- architecture, consistent with the guest_reference convention and the
-- exact table-naming pattern established by skill_tree/collection
-- (definitions -> instances/ownership -> learner_state).
--
-- Timezone convention: this project has no per-guest timezone system —
-- every existing timestamp column across all 87 prior migrations is
-- TIMESTAMPTZ resolved via Postgres now()/CURRENT_DATE (UTC-backed).
-- Challenge period boundaries use the same convention: daily periods are
-- UTC calendar days, weekly periods are UTC ISO weeks (Monday start).

CREATE TABLE IF NOT EXISTS smokecraft_challenge_definitions (
  id BIGSERIAL PRIMARY KEY,
  challenge_key TEXT NOT NULL UNIQUE,
  display_title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('single_event', 'multi_event')),
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly')),
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_value INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 0,
  collection_reward_key TEXT REFERENCES smokecraft_collection_items(item_key) ON DELETE SET NULL,
  skill_tree_relationship TEXT,
  golden_box_relevance TEXT,
  asset_reference TEXT,
  display_order INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deterministic period instances. instance_key is derived server-side
-- from (challenge_key, effective_start) and is the idempotency guard —
-- a repeated resolver call for the same period always resolves to the
-- same row (INSERT ... ON CONFLICT (instance_key) DO NOTHING), never a
-- new instance created per page load.
CREATE TABLE IF NOT EXISTS smokecraft_challenge_instances (
  id BIGSERIAL PRIMARY KEY,
  instance_key TEXT NOT NULL UNIQUE,
  challenge_key TEXT NOT NULL REFERENCES smokecraft_challenge_definitions(challenge_key) ON DELETE CASCADE,
  effective_start TIMESTAMPTZ NOT NULL,
  effective_end TIMESTAMPTZ NOT NULL,
  cancelled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_key, effective_start)
);
CREATE INDEX IF NOT EXISTS idx_sci_challenge ON smokecraft_challenge_instances (challenge_key);

CREATE TABLE IF NOT EXISTS smokecraft_challenge_learner_state (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  challenge_instance_key TEXT NOT NULL REFERENCES smokecraft_challenge_instances(instance_key) ON DELETE CASCADE,
  participation_state TEXT NOT NULL DEFAULT 'available' CHECK (participation_state IN ('available', 'in_progress', 'completed', 'expired')),
  progress_value INT NOT NULL DEFAULT 0,
  target_value_snapshot INT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_source TEXT,
  supporting_progression_event_id BIGINT REFERENCES smokecraft_progression_events(id) ON DELETE SET NULL,
  source_record_id TEXT,
  reward_granted_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, challenge_instance_key)
);
CREATE INDEX IF NOT EXISTS idx_scls_guest ON smokecraft_challenge_learner_state (guest_reference);

-- Stable challenge definitions only — no instances, no learner
-- completion is seeded here. Exactly 2 definitions, disclosed:
-- 1 Daily / single-event, 1 Weekly / multi-event, matching the
-- mandate's minimum-proof requirement without seeding "dozens of
-- generic challenges."
INSERT INTO smokecraft_challenge_definitions
  (challenge_key, display_title, description, challenge_type, cadence, category, requirement_type, requirement_config, target_value, xp_reward, golden_box_relevance, display_order)
VALUES
  ('daily-lesson-practice', 'Daily Practice', 'Complete one real SmokeCraft lesson or activity today.', 'single_event', 'daily', 'Practice', 'progression_event_in_period', '{"minDistinctEventTypes": 1}'::jsonb, 1, 0, 'Consistent daily practice builds the habits Golden Box competitors rely on.', 1),
  ('weekly-multi-activity-builder', 'Weekly Builder', 'Engage with at least three different SmokeCraft learning activities this week.', 'multi_event', 'weekly', 'Consistency', 'progression_event_breadth_in_period', '{"minDistinctEventTypes": 3}'::jsonb, 3, 0, 'Breadth across lessons, challenges, and construction practice best prepares a learner for Golden Box.', 2)
ON CONFLICT (challenge_key) DO NOTHING;
