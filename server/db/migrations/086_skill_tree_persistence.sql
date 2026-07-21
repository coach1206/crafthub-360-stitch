-- Skill Tree Persistence (controlled pass, after 085). Additive only —
-- does not touch migrations 075-085, does not alter Filler Arrangement
-- data, does not create a competing event log (smokecraft_progression_events
-- from 085 is reused, not duplicated).
--
-- Scope: 7 nodes, one per the approved-artwork category (Foundation, Leaf
-- & Process, Construction, Flavor & Experience, Pairing & Pairings,
-- Mastery & Blending, Community & Legacy), each backed by a distinct,
-- already-existing, real backend evidence table — not fabricated data.
-- Definitions are seeded (stable content); learner completion state is
-- computed server-side from real evidence, never seeded or accepted
-- from the client.

CREATE TABLE IF NOT EXISTS smokecraft_skill_tree_nodes (
  id BIGSERIAL PRIMARY KEY,
  node_key TEXT NOT NULL UNIQUE,
  display_title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  phase_reference TEXT,
  session_reference TEXT,
  prerequisite_node_keys TEXT[] NOT NULL DEFAULT '{}',
  unlock_rule TEXT NOT NULL,
  completion_rule TEXT NOT NULL,
  xp_reward INT NOT NULL DEFAULT 0,
  golden_box_relevance TEXT,
  display_order INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS smokecraft_skill_tree_learner_state (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  node_key TEXT NOT NULL REFERENCES smokecraft_skill_tree_nodes(node_key) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'locked' CHECK (state IN ('locked', 'available', 'in_progress', 'completed')),
  unlock_source TEXT,
  completion_source TEXT,
  completed_at TIMESTAMPTZ,
  progress_percent INT,
  supporting_event_id BIGINT REFERENCES smokecraft_progression_events(id) ON DELETE SET NULL,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, node_key)
);
CREATE INDEX IF NOT EXISTS idx_stls_guest ON smokecraft_skill_tree_learner_state (guest_reference);

-- Stable node definitions, display order matches the approved artwork's
-- category order exactly (skill tree 1.png). Prerequisites form a
-- sequential chain matching that same order.
INSERT INTO smokecraft_skill_tree_nodes
  (node_key, display_title, description, category, phase_reference, prerequisite_node_keys, unlock_rule, completion_rule, xp_reward, golden_box_relevance, display_order)
VALUES
  ('foundation', 'Foundation', 'Seed genetics, soil types, and terroir — the ground every blend starts from.', 'Foundation', 'Arrival', '{}', 'always_available', 'seed_soil_engagement', 10, 'Understanding origin informs Golden Box seed/soil selection.', 1),
  ('leaf-process', 'Leaf & Process', 'How filler leaves are selected, arranged, and processed before rolling.', 'Leaf & Process', 'First Third', '{foundation}', 'requires:foundation', 'filler_arrangement_completion', 10, 'Filler arrangement directly affects Golden Box construction scoring.', 2),
  ('construction', 'Construction', 'The physical rolling process — bunching, wrapper application, cap, and foot.', 'Construction', 'First Third', '{leaf-process}', 'requires:leaf-process', 'rolling_progress_engagement', 15, 'Construction quality is a real Golden Box judging category.', 3),
  ('flavor-experience', 'Flavor & Experience', 'Cold aroma, cold draw, and flavor progression through the three thirds.', 'Flavor & Experience', 'Second Third', '{construction}', 'requires:construction', 'flavor_stage_engagement', 15, 'Flavor tracking supports the Golden Box flavor review.', 4),
  ('pairing-pairings', 'Pairing & Pairings', 'Building and evaluating spirit and food pairings for a given blend.', 'Pairing & Pairings', 'Second Third', '{flavor-experience}', 'requires:flavor-experience', 'pairing_draft_engagement', 15, 'Pairing defense is a real step in the Golden Box entry workflow.', 5),
  ('mastery-blending', 'Mastery & Blending', 'Submitting a real Golden Box entry — the practical application of everything above.', 'Mastery & Blending', 'Final Third', '{pairing-pairings}', 'requires:pairing-pairings', 'golden_box_entry_exists', 25, 'This node is Golden Box participation itself.', 6),
  ('community-legacy', 'Community & Legacy', 'Engaging broadly across SmokeCraft — lessons, challenges, and mentor guidance together.', 'Community & Legacy', 'Reflection', '{mastery-blending}', 'requires:mastery-blending', 'progression_event_breadth', 20, 'A well-rounded learner is best prepared for competitive Golden Box rounds.', 7)
ON CONFLICT (node_key) DO NOTHING;
