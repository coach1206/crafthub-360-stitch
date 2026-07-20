# Package 6 Closure — Personalized Pairing Recommendation Map

## Approach: rule-based, explainable, honestly limited

`flavorPairingService.getRecommendations(guestReference)` reads only the
guest's own saved `smokecraft_flavor_stage_observations` rows (no other
learner's data, no fabricated catalog). It aggregates flavor-note
frequency across every recorded stage, ranks the most-observed notes, and
maps each to a real pairing suggestion via a static `FLAVOR_PAIRING_RULES`
table (cocoa→coffee, spice→rum, sweet→dark chocolate, etc.) — genuine,
documented reasoning, not fabricated commercial inventory.

## Honest states

- **`not_enough_data`**: returned when zero flavor notes have been
  recorded anywhere, or when recorded notes don't map to any rule (rare,
  since most seeded taxonomy groups have a rule). The UI shows "Not
  enough data yet — record some flavor notes in the Flavor Wheel above."
  Verified by test: recommendations show this state before any Flavor
  Wheel interaction.
- **`ready`**: up to 3 recommendations, each carrying `confidence`
  (`low`/`moderate`, based on how many times that note was observed),
  `dataUsed` (exact note, times observed, total stages recorded), and an
  explicit `limitation` string reminding the learner this is based only
  on their own notes.

No `mentor_not_selected` or `catalog_not_configured` states were needed
this pass since the recommendation engine doesn't depend on mentor
selection or an external catalog — disclosed as a smaller data-source set
than the mandate's full list (Golden Box practice-blend profile,
saved pairing preferences, and prior pairing reasoning were not wired
into the ranking logic this pass — see known limitations in the
completion report).

## Explainability fields (every recommendation)

`title`, `pairingCategory`, `pairingItem`, `strategy` (complement/
contrast), `why`, `complements`/`contrasts` (which flavor note drove the
strategy), `confidence`, `limitation`, `source` (always `'rule_based'`
this pass — no mentor-guided or AI-assisted recommendation path exists
yet, so the source label is always accurate, never fabricated), `dataUsed`.

## Privacy

`getRecommendations` only ever reads the calling guest's own
`smokecraft_flavor_stage_observations` rows (`WHERE guest_reference = $1`
implicit via `getFlavorStages`) — verified no cross-guest leakage is
possible since the query has no path to another guest's data.

## Known limitation, disclosed

The mandate's full data-source list (Golden Box practice-blend profile,
saved pairing preferences/reasoning, mentor selection, strength/body
targets) is not yet wired into the ranking — only flavor-stage
observations drive recommendations this pass. AI-assisted recommendations
were not built (the `source` field's `'mentor_guided'`/`'ai_assisted'`
values are reserved but unused) — disclosed for Package 7 or a dedicated
follow-up.
