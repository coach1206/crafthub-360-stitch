# 01 — Discovery Report

**Starting commit:** `8dd76144`

## Canonical sources consulted

- `src/constants/smokecraftRequiredInteractions.js`
- `public/proof/smokecraft-required-interaction-manifest-audit/12-implementation-package-plan.md` (Package D: Sessions 3, 4, 15)
- Existing source: `MeetYourCigar.jsx`, `Terroir.jsx`, `KnowledgeDrop.jsx`

## Per-session discovery

| | Session 3 | Session 4 | Session 15 |
|---|---|---|---|
| Title | Meet Your Cigar | Terroir | Knowledge Drop |
| Phase | 1 | 1 | 3 |
| Route | /smokecraft/meet-your-cigar | /smokecraft/terroir | /smokecraft/knowledge-drop |
| Learning objective | Explore the selected cigar's brand/blend/wrapper/binder/filler/factory profile | Understand how country/region/soil/climate shape a cigar's character | Explore 4 educational topics (Tobacco/Fermentation/Aging/Factory Story) |
| Component | MeetYourCigar.jsx | Terroir.jsx | KnowledgeDrop.jsx |
| Prior behavior | 7 real content sections gated behind clicks, local viewedSections tracking only | 6 real sections (5 factors + "Why It Matters"), local viewedSections tracking only | 4 real topics each with a real, already-authored quiz (question/3 options/answer index) — the quiz was **optional** and **client-graded** |
| Required educational elements | Only 3 of 7 sections ever carry real, non-fallback content for the fixed 8-cigar catalog (Brand/Blend/Wrapper — Binder/Filler/Factory/Master Blender are always null/"Not available") | All 5 real factors (Country/Region/Soil/Climate/Growing Conditions); "Why It Matters" is meta-commentary, not a 6th factor | All 4 real topics, each with a real quiz |
| Existing backend | none dedicated | none dedicated | none dedicated (quiz answer key lived only client-side) |
| Existing completion rule | generic completeSession('meet-your-cigar') | generic completeSession('terroir') | generic completeSession('knowledge-drop') |
| Existing XP rule | **none — no reward-table entry existed at all** (see doc 08 defect) | **none — no reward-table entry existed at all** | 75 XP (unchanged) |
| Existing mentor requirement | none | none | none |
| Existing tests | none | none | none |
| Exact gap | Opening panels alone completed the session; no synthesis/applied step; discovered a deeper defect (see below) | Same pattern as Session 3 | Optional quiz never gated completion; answer key was client-visible, never server-graded |

## Owner decision (locked, per this mandate)

Each target session requires: (1) inspect all required elements, (2) record observations at each, (3) complete a synthesis/judgment/application step, (4) submit evidence server-side, (5) receive server-owned completion/XP/progression. Applied per session's real content — not identical UI, not a generic quiz bolted onto every session (Sessions 3/4 use a reflective judgment synthesis since their content is inherently non-gradable personal reasoning; Session 15 uses real, objective quiz grading since a real answer key already existed in the codebase).

## Canonical-source agreement

No disagreement found between the manifest, the audit, and the actual repository content for any of the 3 sessions.
