# 21-Session Implementation Audit — Required Output Table

Built from direct source inspection of every session component's
imports and API/service usage (`grep` evidence reproduced in
`03-canonical-session-inventory.md`), cross-referenced with the
existing `SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md`'s captured-
content findings for UI-presence claims. Full per-session detail and
rationale lives in `src/constants/smokecraftRequiredInteractions.js`
(the canonical manifest itself, `notes` field per entry) — this table
is the required condensed summary.

| # | Phase | Route | Required interaction | Type | Backend | Persistence | Scoring | Progression | Mentor | Tests | Status | Exact gap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | /smokecraft/welcome | Orientation dashboard | orientation-dashboard | shared completion | shared completion | n/a | ✅ | — | none new | **COMPLETE_AND_VERIFIED** | none — no assessment appropriate |
| 2 | 1 | /smokecraft/humidor-match | Humidor+cigar selection | device-simulation-selection | shared completion only | local state only | none | ✅ (completion only) | — | none | **VISUAL_ONLY** | real selection captured locally, never server-evaluated |
| 3 | 1 | /smokecraft/meet-your-cigar | 7-section profile exploration | content-exploration | shared completion only | local state only | none | ✅ (completion only) | — | none | **PARTIAL** | exploration not server-verified |
| 4 | 1 | /smokecraft/terroir | Terroir exploration | content-exploration | shared completion only | local state only | none | ✅ (completion only) | — | none | **PARTIAL** | same as #3 |
| 5 | 1 | /smokecraft/format | Shape/size classification | construction-classification | shared completion only | local state only | none | ✅ (completion only) | — | none | **VISUAL_ONLY** | classification not server-evaluated |
| 6 | 1 | /smokecraft/cut-toast-light | Cut-style selection | technique-selection | shared completion only | local state only | none | ✅ (completion only) | — | none | **VISUAL_ONLY** | selection not server-evaluated |
| 7 | 1 | /smokecraft/lighting-tutorial | 8-step technique walkthrough | stepwise-instructional | shared completion | shared completion | n/a | ✅ | — | none new | **COMPLETE_AND_VERIFIED** | none — walkthrough is the appropriate interaction |
| 8 | 2 | /smokecraft/first-third | First-third tasting capture | tasting-rating-capture | shared completion only | local state only (real tasting-drafts service exists elsewhere, unused here) | none | ✅ (completion only) | — | none | **PARTIAL** | not using the app's own available server-authoritative tasting-draft architecture |
| 10 | 2 | /smokecraft/flavor-memory | Flavor-wheel selection | flavor-wheel-selection | shared completion only | local state only | none | ✅ (completion only) | — | none | **VISUAL_ONLY** | selection not server-evaluated |
| 11 | 2 | /smokecraft/pairing-lab | Pairing decision | pairing-decision-and-scoring | real pairing engine | smokecraft_pairing_saves | real | ✅ | — | 36/36 | **COMPLETE_AND_VERIFIED** | none |
| 12 | 3 | /smokecraft/second-third | Second-third tasting capture | tasting-rating-capture | shared completion only | local state only | none | ✅ (completion only) | — | none | **PARTIAL** | same as #8 |
| 14 | 3 | /smokecraft/mentor-commentary | Mentor-guided response | mentor-guided-response | real mentor guidance service | real | n/a | ✅ | ✅ real | 21/21 | **COMPLETE_AND_VERIFIED** | none |
| 15 | 3 | /smokecraft/knowledge-drop | 4-topic exploration | topic-exploration | shared completion only | local state only | none | ✅ (completion only) | — | none | **PARTIAL** | exploration not server-verified, no assessment found |
| 16 | 4 | /smokecraft/final-third | Final-third tasting capture | tasting-rating-capture | shared completion only | local state only | none | ✅ (completion only) | — | none | **PARTIAL** | same as #8/#12 |
| 19 | 5 | /smokecraft/scorecard | 6-category rating | multi-category-rating | shared completion only | local state only | none | ✅ (completion only) | — | none | **PARTIAL** | ratings not server-persisted/evaluated independent of generic completion |
| 21 | 6 | /smokecraft/ai-summary | Rule-based summary review | rule-based-summary-review | shared completion | shared completion | n/a | ✅ | — | none new | **COMPLETE_AND_VERIFIED** | none — review session by design |
| 22 | 6 | /smokecraft/pairing-recommendations | Personalized pairing decision | pairing-decision-and-scoring | real pairing engine | smokecraft_pairing_saves | real | ✅ | — | 36/36 (shared suite) | **COMPLETE_AND_VERIFIED** | none |
| 23 | 6 | /smokecraft/passport-stamp | Stamp certification | status-gated-certification | real GET status endpoint | real (claim gated on S24, pre-existing design) | n/a | ✅ | — | none new | **PARTIAL** | claim UI sequencing quirk pre-dates this pass, not independently re-verified here |
| 24 | 6 | /smokecraft/final-review | Checklist recap | checklist-review | shared completion | shared completion | n/a | ✅ | — | none new | **COMPLETE_AND_VERIFIED** | none — recap session by design |
| 25 | 6 | /smokecraft/rewards | Reward/XP review | reward-display | shared completion | shared completion | n/a | ✅ | — | none new | **COMPLETE_BUT_UNTESTED** | live-vs-local totals source not independently verified this pass |
| 27 | 6 | /smokecraft/session-complete | Next-journey recommendation | final-recommendation-display | shared completion | shared completion | n/a | ✅ | — | none new | **COMPLETE_AND_VERIFIED** | none — real personalization confirmed by prior audit |

## Totals

- **COMPLETE_AND_VERIFIED: 8** (sessions 1, 7, 11, 14, 21, 22, 24, 27)
- **COMPLETE_BUT_UNTESTED: 1** (session 25)
- **PARTIAL: 8** (sessions 3, 4, 8, 12, 15, 16, 19, 23)
- **VISUAL_ONLY: 4** (sessions 2, 5, 6, 10)
- **WRONG_INTERACTION_TYPE: 0**
- **MISSING: 0**
- **BLOCKED: 0**
- **DUPLICATED_OR_CONFLICTING: 0**

No session is entirely missing an interaction, wrong-typed, blocked, or
duplicated. The real gap is uniform and architectural: 12 of 21
sessions (the 8 PARTIAL + 4 VISUAL_ONLY) capture genuine player input
but never submit it to a server endpoint that evaluates or persists it
independent of the generic, answer-agnostic completion call.
