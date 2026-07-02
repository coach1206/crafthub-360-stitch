# NCIE — NOVEE Craft Intelligence Engine Foundation

## Important Notice

The NCIE provides educational guidance, mentor personas, decision support, recommendations, commerce intelligence, and analytics previews. It does not claim to deliver verified AI responses, live inventory data, or accurate financial reporting without verified integrations. All NCIE outputs are preview-only unless a live, verified data source is connected.

## What NCIE Does

NCIE is a reusable intelligence layer that powers all 14 Craft360 verticals. It is not vertical-specific — it is a platform engine that each vertical consumes.

### 6 Core Engines

| Engine | Purpose | Default Status |
|--------|---------|---------------|
| Knowledge Engine | Structured learning content per vertical | `knowledge_available` |
| Mentor Engine | Mentor persona selection and session management | `mentor_available` |
| Decision Engine | Guided product/experience decision support | `decision_available` |
| Recommendation Engine | Cross-craft and intra-craft suggestions | `recommendation_available` |
| Commerce Intelligence Engine | Venue/partner commerce signals | `commerce_preview` |
| Analytics Intelligence Engine | Learning and engagement analytics | `analytics_preview` |

### Supporting Engines

| Engine | Purpose |
|--------|---------|
| Passport Mastery Engine | Craft XP, global XP, mastery percent, certification tracking |
| OpenAI Education Client | AI-personalized delivery of internal outlines |

## AI Personalization Rules

1. OpenAI personalizes the **delivery** of educational content — tone, analogies, explanations
2. **Internal NCIE knowledge outlines are always the source of truth** — AI cannot override them
3. AI returns `ai_unavailable` when `VITE_OPENAI_KEY` is not configured
4. The following data is **never sent to OpenAI**:
   - Payment data, Stripe tokens, access tokens
   - Bank account numbers, routing numbers
   - Tax IDs, EINs, SSNs
   - Raw order IDs linked to financial transactions
   - Sensitive venue or vendor records

## SmokeCraft Passport Lock Rule Protection

The NCIE Passport Mastery Engine adds XP metadata but does **not** override, replace, or bypass SmokeCraft Passport stamp lock rules. Stamp unlock gates are enforced exclusively by:
- `src/constants/session.js` — VISIT_STRUCTURE and session lock rules
- SmokeCraft's own session/visit progression logic

The mastery engine provides `craftXP`, `globalXP`, and `masteryPercent` only.

## Decision Engine Outputs

Every decision response includes:

| Field | Description |
|-------|-------------|
| `whyThisFits` | Why this recommendation matches the guest's preferences |
| `lessonInfluences` | Which lessons shaped this decision |
| `mentorExplanation` | The mentor persona's explanation |
| `confidenceScore` | 0–100 match confidence |
| `alternativeChoices` | Up to 3 alternative recommendations |
| `learnMoreBeforeChoosing` | Lessons to explore before committing |

## Recommendation Rules

- Returns `inventory_unavailable` when no live inventory is connected
- Cross-craft recommendations return `cross_craft_preview`
- Lesson recommendations always available from internal taxonomy

## Data Files

| File | Contents |
|------|---------|
| `src/data/ncie/craftCatalog.js` | Full schema for all 14 craft verticals |
| `src/data/ncie/knowledgeTaxonomy.js` | Structured knowledge domains and topics |
| `src/data/ncie/mentorProfiles.js` | Mentor archetypes and AI persona hints |
| `src/data/ncie/decisionRules.js` | Guided decision rules per vertical |
| `src/data/ncie/recommendationRules.js` | Recommendation logic, cross-craft rules |
| `src/data/ncie/certificationPaths.js` | Certification level milestones per vertical |
| `src/data/ncie/analyticsEvents.js` | Analytics event schema definitions |
| `src/data/ncie/passportMasteryRules.js` | XP thresholds and mastery calculation rules |
