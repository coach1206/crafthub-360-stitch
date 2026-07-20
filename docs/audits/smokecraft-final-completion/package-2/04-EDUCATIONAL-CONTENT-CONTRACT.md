# Educational Content Contract — Package 2

`src/components/smokecraft/goldenBox/educationalContentContract.js`
defines the single shape every educational interaction must produce:

```
{ id, title, category, definition, whyItMatters, qualityImpact,
  flavorImpact, constructionImpact, performanceImpact, decisionGuidance,
  compatibilityNotes, mentorGuidance, relatedSession, relatedQuiz,
  relatedXpOpportunity, mediaAssetKey, sourceStatus }
```

`sourceStatus` is one of `'curated_platform_content'` |
`'database_backed'` | `'not_yet_available'` — always honest about
whether real content exists.

Two constructors:
- `fromCatalogRow(row)` — converts a real
  `golden_box_component_catalog` row into this shape (future path, once
  Package 3+ seeds real starter content).
- `notYetConfigured(category)` — honest fallback used today, since
  `golden_box_component_catalog` has zero seed rows (a disclosed Package
  1 state, not fabricated content).

`EducationalDetailPanel.jsx` is the **one** reusable modal that renders
this shape — used for every clickable educational item in
`EntryWorkspace.jsx`'s component pickers (and designed to be reused by
any future Golden Box screen needing the same interaction, e.g. mentor
insight, image hotspots, badges, rewards, per the mandate's full list).

This is the "reusable content contract that can later connect to
database-backed educational content" the mandate asked for — no
educational copy is hardcoded into scattered JSX arrays; it flows
through this one shape regardless of source.
