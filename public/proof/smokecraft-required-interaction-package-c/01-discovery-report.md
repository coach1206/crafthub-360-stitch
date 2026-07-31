# 01 — Discovery Report

**Starting commit:** `013bc4d2`

## Canonical sources consulted

- `src/constants/smokecraftRequiredInteractions.js`
- `public/proof/smokecraft-required-interaction-manifest-audit/12-implementation-package-plan.md` (Package C: Sessions 2, 5, 6, 10, "requires an owner product decision per session on what makes a selection 'correct'")
- `public/proof/smokecraft-required-interaction-manifest-audit/04-session-by-session-product-decisions.md`
- `public/proof/smokecraft-required-interaction-manifest-audit/05-21-session-implementation-audit.md`
- Existing source: `HumidorMatch.jsx`, `Format.jsx`, `CutToastLight.jsx`, `FlavorMemory.jsx`

## Per-session discovery

| | Session 2 | Session 5 | Session 6 | Session 10 |
|---|---|---|---|---|
| Title | Choose Your Cigar | Construction Inspection | Choose Your Cut | Flavor Memory Exercise |
| Phase | 1 | 1 | 1 | 2 |
| Route | /smokecraft/humidor-match | /smokecraft/format | /smokecraft/cut-toast-light | /smokecraft/flavor-memory |
| Learning objective | Apply humidor environment knowledge (temp/humidity/seal/airflow) to select an appropriate cigar | Classify cigar shape/size and its effect on burn/body | Select an appropriate cut style for the chosen cigar | Select flavor-wheel notes and intensity/body/strength ratings |
| Component | HumidorMatch.jsx | Format.jsx | CutToastLight.jsx | FlavorMemory.jsx |
| Prior visual-only behavior | 3 real environment-zone buttons + rich temp/humidity/seal/airflow simulation, local state only | 6 real shape buttons with real per-shape stats (length/ring gauge/burn time), local state only | 3 real cut-method buttons + real "Learn Why" tips, local state only | 8 real flavor-wheel hotspots + live radar chart + perception sliders, saved to a real but unauthenticated/unguarded legacy endpoint |
| Existing backend | none dedicated | none dedicated | none dedicated | `/api/modules/smokecraft/pairing/flavor-memory` (real DB write, but never gated completion) |
| Existing progression | generic completeSession('humidor-match') | generic completeSession('format') | generic completeSession('cut-toast-light') | generic completeSession('flavor-memory') |
| Existing XP rule | 75 XP (`smokecraftRewards.js`, unchanged) | 75 XP + secondary 'wrapper-strength' award (unchanged) | 75 XP (unchanged) | 75 XP (unchanged) |
| Mentor requirement | none | none | none | none |
| Reward/Passport dependency | none beyond standard session badge | none beyond standard session badges | none beyond standard session badge | none beyond standard session badges |
| Existing tests | none | none | none | none |
| Exact gap | No server endpoint evaluated whether the selection was appropriate before `awardSessionRewards()` fired | No server-side evaluation of the classification | Selection was local-only, not server-evaluated | Local state only / unguarded write, same pattern as Session 8 pre-Package-A |

## Owner-decision resolution

The audit flagged Package C sessions as requiring "an owner product decision per session on what makes a selection 'correct'." This mandate itself **resolves** that decision by locking the interaction type per session (image-selection / sequencing / matching / hotspot) and by directing "do not guess... inspect and document." Each session's real, already-existing content supplied a genuine, defensible correct answer without inventing anything:

- **Session 2**: the 3 real storage environments (Virtual Humidor / Dry Box / Travel Case) — only the Virtual Humidor is actually climate-controlled, a real fact implied by the session's own learning objective ("humidor environment knowledge").
- **Session 5**: the 6 real shapes' own already-documented `burnTime` ranges (unchanged, pre-existing content) directly imply a correct shortest-to-longest order.
- **Session 6**: the 3 real cut methods' own already-documented `METHOD_TIPS` text directly names each one's defining characteristic.
- **Session 10**: flavor perception is inherently subjective (no ground-truth "correct" flavor for a real cigar) — resolved using the same principled approach Package A already established for tasting-note sessions: "correct" means a real, in-vocabulary selection was made, not a graded judgment.

No disagreement was found between the canonical manifest, the audit, and the actual repository content — proceeded with implementation for all 4 sessions.
