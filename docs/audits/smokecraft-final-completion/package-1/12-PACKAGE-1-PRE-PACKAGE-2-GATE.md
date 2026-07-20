# Pre-Package-2 Gate

## Permanent SmokeCraft image directive (recorded per Step 11)

The user is currently creating the new and missing SmokeCraft 360
images. These images remain **required** and will be integrated in
later packages. Their absence today must never be treated as
cancellation, completion, or permission to permanently use placeholders.

Every interactive image, hotspot, plant part, anatomy card, cigar,
mentor, badge, pairing item, ingredient, flavor note, quiz element,
challenge item, and clickable visual must provide meaningful educational
information covering: what the item is, why it matters, how it affects
quality, how it affects flavor, how it affects construction or
performance, how it should affect the learner's decision, and what the
learner should consider before selecting it. Visuals that appear
interactive may never be decorative-only.

Future integration must connect the educational visual content to:
database content records, APIs, routes, `SC_ASSETS`, live UI components,
accessibility labels, responsive layouts, and quiz/XP systems where
applicable.

This directive was not acted on in Package 1 (no images were created,
replaced, or integrated this package, per Step 11's own instruction) —
it is recorded here as a standing requirement for every future package
that touches SmokeCraft visuals, starting with whichever package first
builds Golden Box or education-content UI.

## Gate criteria checklist

| Criterion | Status | Evidence |
|---|---|---|
| Exact path-count discrepancy explained | ✅ | `08-PACKAGE-1-EXACT-FILE-MANIFEST.md` — git status directory-collapsing, verified with `ls`/`git ls-files` |
| Every Package 1 file identified | ✅ | `08-PACKAGE-1-EXACT-FILE-MANIFEST.md` full manifest table |
| Migration 077 contains no unexplained duplicate structures | ✅ | `09-MIGRATION-077-SAFETY-REVIEW.md` — every table mapped to a named mandate entity; reuse decisions documented for identity/venue/leaderboard/badge/passport |
| Existing-table changes backward-compatible | ✅ (with one disclosed follow-up recommendation) | `09-MIGRATION-077-SAFETY-REVIEW.md` — additive-only columns, relaxed NOT NULL never breaks a read; one recommended-but-not-blocking narrower CHECK constraint noted |
| Recipe privacy enforced server-side | ✅ | `visibilityService.js`, live-tested (checks #14, #15, #17, #18 in `10-...-TEST-INVENTORY.md`) |
| Null-comparison vulnerability has regression coverage | ✅ | Check #14, `10-...-TEST-INVENTORY.md` Step 6 section |
| Lifecycle transitions have regression coverage | ✅ | Checks #11, #24, #25 |
| All 17 API routes documented | ✅ | `10-PACKAGE-1-API-SERVICE-TEST-INVENTORY.md` |
| All 10 services documented | ✅ | Same document |
| All 36 tests documented | ✅ | Same document |
| Protected work confirmed untouched | ✅ | `11-PACKAGE-1-PROTECTED-WORK-VERIFICATION.md` |
| Future image integration remains explicitly required | ✅ | This document, section above |
| No unknown Package 1 file remains | ✅ | `08-PACKAGE-1-EXACT-FILE-MANIFEST.md` — zero "UNKNOWN OR MIXED-OWNERSHIP" classifications |
| No production file was modified during this review | ✅ | This review task created/edited only documentation files: `07` (corrected a count), `08`–`12` (new) |

## Outstanding non-blocking items carried forward

1. AI-analysis routes (#14/#15 in the route table) don't re-verify entry
   ownership the same way the entry-read route does — recommended fix,
   not a blocker since no recipe/score data flows through that path.
2. `smoke_leaderboard_entries` could use a compensating CHECK constraint
   tying the relaxed `smoke_session_id` nullability to `category='golden_box'`
   — recommended, not blocking.
3. Package B/E regression suites were not reconfirmed clean during
   Package 1 itself (documented in `05-TEST-EVIDENCE.md`) — recommend a
   dedicated clean run before or during Package 2.

None of these block Package 2 — they are documented follow-ups.

## STATUS

**PACKAGE 2 CLEARED**
