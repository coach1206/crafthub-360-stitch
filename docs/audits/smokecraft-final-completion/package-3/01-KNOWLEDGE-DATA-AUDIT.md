# Knowledge Data Audit — Package 3

Classification key: VERIFIED_REUSABLE / INCOMPLETE / DUPLICATED /
HARDCODED / PRESENTATIONAL_ONLY / LEGACY / MISSING.

| Topic | Classification | Evidence |
|---|---|---|
| Seed genetics/varieties/countries/regions/soil/terroir | HARDCODED / MISSING | `SeedSoil.jsx`'s `SEED_ZONES`/`SOIL_ZONES` are inline JS driving hotspots, persisted only to `journey.seedSoil` JSONB; `Terroir.jsx`'s `SECTIONS` is static copy; no DB table exists anywhere |
| Plant anatomy (flower/seed pod/stem/leaf blade/midrib/veins/roots) | MISSING | Only a bare taxonomy label (`topicId:'anatomy'`) in `src/data/ncie/knowledgeTaxonomy.js`, no content, no page |
| Leaf primings (ligero/viso/seco/volado) | PRESENTATIONAL_ONLY | Taxonomy label only + passing mention in `KnowledgeDrop.jsx` copy |
| Wrapper/binder/filler/long-short filler | HARDCODED / LEGACY | One paragraph in `KnowledgeDrop.jsx`; `WrapperStrength.jsx` is now a dead-end redirect |
| Curing/fermentation/aging | HARDCODED (fermentation/aging only) / MISSING (curing) | `KnowledgeDrop.jsx` `TOPICS[1]`/`TOPICS[2]` static paragraphs + inline quiz; no curing content at all |
| Vitola/ring gauge/length | VERIFIED_REUSABLE (partial) / DUPLICATED | `Format.jsx`'s `FORMAT_ZONES` has real structured data (6 shapes) but persists to JSONB only; `CigarGaugeGuide.jsx` is a separate static display; `Vitola.jsx` is an unimplemented stub; free-text `cigar_vitola` columns exist in unrelated POS migrations — **3-way duplication risk**, none canonical |
| Strength/body/aroma/flavor/burn/draw/construction | HARDCODED | Scattered across `Format.jsx`, `pairingEngine.js` (`STRENGTH_SCORE`/`HARMONY`), scoring services — real JS constants, no DB table |
| Pairings | VERIFIED_REUSABLE | `PairingLab.jsx`, `pairingEngine.js`, `smokecraftPairing*` server services — confirmed still real and intact |
| Mentor commentary | VERIFIED_REUSABLE | `smokeCraftMentors.js` roster, `MentorCommentary.jsx`, `mentorController.js` — confirmed intact |
| Quizzes / knowledge checks | HARDCODED (functionally real, not data-driven) | `KnowledgeDrop.jsx`: 4 real interactive quiz objects, but hardcoded in JSX; `min_quiz_score` eligibility rule type exists in migration 077 with no backing quiz-content table |
| XP rewards | VERIFIED_REUSABLE | `XP_AWARDS` constant + `xp_accounts`/`xp_transactions`/`xp_award_rules` (migration 077) — confirmed, not duplicated |

## Governing decision for Package 3's schema

**`golden_box_component_catalog`** (migration 077, Package 1) already
exists as a real, empty, correctly-shaped catalog table
(`component_type`, `component_key`, `display_name`, `description`,
`metadata JSONB`, `is_curated_platform_content`, no CHECK restricting
`component_type`). Per the "do not create duplicate records" rule,
Package 3 **extends this table additively** with real educational-impact
columns rather than creating a second, parallel `smokecraft_components`
table — see `02-EDUCATIONAL-CONTENT-DATA-MODEL.md`.
