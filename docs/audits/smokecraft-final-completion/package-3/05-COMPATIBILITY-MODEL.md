# Component Compatibility Model — Package 3

`smokecraft_component_compatibility` — 15 relationship types (complements,
contrasts, balances, may_overpower, may_weaken_combustion,
may_improve_burn, may_increase_strength, may_soften_strength,
may_increase_sweetness, may_add_spice, may_add_body, may_affect_draw,
requires_careful_ratio, depends_on_processing, depends_on_vitola).

3 real seeded relationships (idempotent, all requiring a real
`explanation`, never blank):
- Ligero ↔ Volado: `balances` — volado's mild, easy-burning character
  offsets ligero's intensity.
- Ligero ↔ Wrapper: `may_overpower` — high ligero proportion can
  overwhelm a delicate wrapper's own flavor.
- Long Filler ↔ Short Filler: `contrasts` — alternative construction
  choices, not typically blended together.

**Decision support, not guaranteed formulas** — `evidence_status`
(`curated_platform_content`/`reviewed`/`unverified`) and
`decision_guidance`/`mentor_note` fields exist precisely so no
relationship is ever presented as an automatic winning-blend formula,
per the mandate's explicit instruction.
