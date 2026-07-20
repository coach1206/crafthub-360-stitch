# Package 6 — Experience Audit & Locked Session Map

Combined (audit + session map) — consolidated per the same disclosed
documentation-format choice used in Packages 5's closure pass.

## Audit

| Area | Screen/Route | Classification | Notes |
|---|---|---|---|
| Meet Your Cigar | `/smokecraft/meet-your-cigar` | VERIFIED_COMPLETE | Real, built (279 lines), session 3 — not touched |
| Cigar anatomy (head/cap/shoulder/body/foot) | none | MISSING_CONTENT / MISSING_INTERACTION | No `cigar_anatomy` catalog rows existed |
| Construction inspection | `/smokecraft/format` | VERIFIED_COMPLETE | Session 5, real hardcoded vitola/shape picker — not rebuilt, not duplicated |
| Cold aroma / cold draw | none dedicated | MISSING_CONTENT | Folded into the new Flavor Wheel's `cold_aroma`/`cold_draw` stages rather than built as separate screens (disclosed consolidation) |
| Ring gauge / length | Golden Box blend picker only | FUNCTIONAL_BUT_INCOMPLETE | Real catalog rows existed, no standalone lesson |
| Vitola / shape | `/smokecraft/format` (hardcoded) + Golden Box picker | FUNCTIONAL_BUT_INCOMPLETE | Real catalog rows existed separately, not cross-linked |
| Strength vs. body | Golden Box blend picker only | FUNCTIONAL_BUT_INCOMPLETE | Real `sensory_category` rows existed, no dedicated comparison |
| Cutting | `/smokecraft/cut-toast-light` | VERIFIED_COMPLETE | Real, built (188 lines) — not touched |
| Lighting | `/smokecraft/lighting-tutorial` | VERIFIED_COMPLETE | Real, built (375 lines) — not touched |
| Smoking technique (cadence, retrohale, relighting) | none dedicated | MISSING_CONTENT | Not built this pass — disclosed gap, see completion report |
| Burn/draw troubleshooting | none | MISSING_CONTENT | No catalog rows existed |
| Complete Flavor Wheel | `smokecraft_flavor_notes` (data only) | STATIC_SHELL | Real taxonomy, zero interactive UI |
| Flavor progression by stage | none | MISSING_CONTENT | No persistence structure existed |
| Pairing education/Builder | `PairingLab.jsx` | PROTECTED / VERIFIED_COMPLETE | Real, verified — not rebuilt; a *new*, separate practice Pairing Builder was added instead (disclosed as distinct from Pairing Lab) |
| Personalized recommendations | none new | MISSING_CONTENT | Not built this pass — disclosed gap |
| `/smokecraft/vitola` route | legacy `SMOKECRAFT_FLOW` entry | FUNCTIONAL_BUT_INCOMPLETE → now VERIFIED_COMPLETE | Was a `ComingSoon` stub; became this package's build target |
| Migrations 075-081 | — | PROTECTED | Not touched |
| Venue Management, Badges, Passport, Leaderboard, `GoldenBox.jsx`, `GoldenBoxStatus.jsx`, `session.js` | — | PROTECTED | Not touched |

No screen was marked complete on the basis of artwork — classifications
reflect actual reading of component source and live interaction testing.

## Locked session map

Same governing decision as Package 5 (`02-LOCKED-SESSION-MAP.md`): the
mandate's proposed "Session 19 through 25" numbering does not match this
repository's real `VISIT_STRUCTURE` (those numbers are already assigned
to Scorecard/AI-Summary/Pairing-Recommendations/Passport-Stamp content).
Per the mandate's own instruction to preserve real repository names when
they differ, **no session was renumbered or reassigned**.

**Decision**: Package 6 content is built entirely into the existing
`vitola` legacy-flow route (`SMOKECRAFT_FLOW`, not part of
`TOTAL_SESSIONS`), which was a dead `ComingSoon` stub. This is not a new
route, not a new session, and not a 28th primary session — it converts an
existing non-functional placeholder into a real, live experience, exactly
the same pattern Package 5 used for `wrapper-strength`.

- `TOTAL_SESSIONS` remains 27, `VISIT_STRUCTURE` unchanged, zero edits to
  any of its 27 session entries.
- `SMOKECRAFT_FLOW`'s `vitola` entry is unchanged in `session.js` (same
  id, route, label) — only the component it renders (`Vitola.jsx`)
  changes from `ComingSoon` to a real screen.
- Sessions 3 (Meet Your Cigar), 5 (Construction Inspection), 6 (Choose
  Your Cut), 7 (Lighting Tutorial) are separate, already-verified screens
  and were not touched.

Cutting, Lighting, and the parts of "Meet Your Cigar"/"Construction
Inspection" that already have real dedicated screens are explicitly **not
rebuilt** — the mandate's own instruction not to rebuild verified,
unrelated screens is honored by leaving them alone rather than
duplicating their content into the new screen.
