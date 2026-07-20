# Package 3 Baseline

- Branch: `recovery/smokecraft-codex-final` (unchanged) · Commit: `aa0b9cf8` (unchanged) · Uncommitted paths: 174
- Latest migration: `078_golden_box_leaderboard_constraint.sql`. Package 3 adds **079** (additive only, does not touch 075-078).
- **Key finding driving this package's design**: `golden_box_component_catalog` (created in migration 077, Package 1) already exists as a real, empty, correctly-shaped tobacco-component catalog table (`component_type TEXT`, `component_key TEXT`, `display_name`, `description`, `metadata JSONB`, `is_curated_platform_content`, `UNIQUE(component_type, component_key)`, **no CHECK constraint restricting `component_type` values**). Per the mandate's own "do not create duplicate records where reusable verified data already exists" rule, Package 3 **extends this table additively** (new real columns for the educational-impact fields) rather than creating a second, parallel `smokecraft_components` table.
- Current Golden Box component endpoints: `EntryWorkspace.jsx`'s `handleSelect()` currently fabricates an honestly-labeled placeholder (`"<type> (catalog not yet configured)"`) since `golden_box_component_catalog` has zero seed rows — Package 3's job is to seed real rows and wire the frontend to read them.
- Current quiz structures: `KnowledgeDrop.jsx` has real interactive quiz UI (4 topics, inline `{question, options, answer}` objects) but the questions are hardcoded JSX, not database-backed. No `quiz_questions` table exists anywhere.
- Current XP award structures: `XP_AWARDS` constant (`src/constants/session.js`) + `xp_accounts`/`xp_transactions`/`xp_award_rules` (migration 077) — real, reusable, not duplicated.
- Current mentor content structures: `MENTORS` roster (`smokeCraftMentors.js`, real: id/country/bio/tags/greeting), `MentorCommentary.jsx`. No topic-specific or component-specific mentor guidance hook exists yet.
- Current `SC_ASSETS` structure: flat keyed object, three-tier resolution (RAW/REF/CROPPED), documented in Package 0's `05-ASSET-REGISTRY.md`.
- Current image placeholder map: `docs/audits/smokecraft-final-completion/package-2/05-ASSET-INTEGRATION-PLACEHOLDER-MAP.md` — hub hero, competition thumbnails, 21 blend-component icons all marked `USER_CREATING_IMAGE`.

Full knowledge-data audit (Step 2) is in `01-KNOWLEDGE-DATA-AUDIT.md`.
