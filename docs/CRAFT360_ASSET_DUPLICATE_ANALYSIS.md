# CraftHub / SmokeCraft — Duplicate Asset Analysis (Parts 6-7)

## Part 6 — CraftHub asset location review

1. **Current import/URL usage**: one constant,
   `CRAFTHUB_IMAGE = '/assets/CRAFTHUB%20360.%20VENUE%20TABLE%20EXPERIENCE.png'`,
   in `src/pages/CraftHub.jsx` line 8, used once (line 68, `src={CRAFTHUB_IMAGE}`).
2. **All references**: exactly one source reference (above). Also
   referenced by proof/test scripts created this session
   (`verify-crafthub-approved-image.mjs`) and by
   `public/proof/crafthub-approved-venue-table-experience/` screenshots,
   which capture the rendered page rather than importing the path
   directly.
3. **Would changing the path break proof or tests?**
   `verify-crafthub-approved-image.mjs` checks the rendered `<img>`'s
   resolved `src` against the expected path — moving the file would
   require updating both `CraftHub.jsx` and that test's expected-path
   assertion together, or the test would fail.
4. **Duplicate exists?** Yes — see the provenance audit's CraftHub
   section: 3 same-named-but-different-hash files elsewhere, none
   referenced by production code.
5. **Does a `crafthub/` folder now exist?** No —
   `public/assets/crafthub/` does not exist (`ls` confirmed).
6. **Recommended canonical location**: `public/assets/crafthub/CRAFTHUB
   360. VENUE TABLE EXPERIENCE.png` is a reasonable future home (mirrors
   the `public/assets/smokecraft/` per-module convention already used
   elsewhere), but moving it is **not required** for correctness — the
   current flat `public/assets/` location works and is not broken.
7. **Required remap files if moved**: `src/pages/CraftHub.jsx` (the
   `CRAFTHUB_IMAGE` constant) and `verify-crafthub-approved-image.mjs`
   (expected-path assertion) would both need a matching one-line change.
8. **Move now or retain current working path?** **Retain.** No functional
   defect exists in the current path; moving it is a pure organizational
   nice-to-have that would touch 2 files and re-run proof for no
   behavioral benefit, and is explicitly out of scope for this
   documentation-only package ("Do not move it in this package").

## Part 7 — Duplicate asset analysis

### Group 1 — "CRAFTHUB 360. VENUE TABLE EXPERIENCE.png" (name collision, NOT a true duplicate)

| File | SHA256 (first 12) | Dimensions | Referenced by |
|---|---|---|---|
| `public/assets/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | `ceb58ced9306` | 1672×941 | `CraftHub.jsx` (production) |
| `public/assets/smokecraft-reference/approved/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | `5d5412399627` | not measured this pass | none (reference folder only) |
| `public/assets/smokecraft-reference/rejected/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | `5d5412399627` | not measured this pass | none |
| `public/assets/smokecraft/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | `5d5412399627` | not measured this pass | none |

**Canonical production file**: `public/assets/CRAFTHUB 360. VENUE TABLE
EXPERIENCE.png` (`ceb58c...`) — keep, unchanged.
**Reference copy to preserve**: none of the three `5d5412...` copies is
confirmed as the correct historical "approved" reference (see the
provenance audit's anomaly writeup) — this needs a human visual
comparison before any of the three can be labeled canonical-historical
vs. safe-to-remove; not resolved in this pass.
**Duplicate safe to remove later**: at minimum, having the same
`5d5412...` file present in three separate folders
(`approved/`, `rejected/`, `smokecraft/`) is redundant regardless of
which one is "correct" — two of the three could be removed once a human
confirms which single copy should be retained as the historical
reference. **Not removed this pass** (instruction: "Do not delete
anything during this package").
**Duplicate that must remain for historical proof**: undetermined until
the visual comparison above happens.

### Group 2 — "crafthub-landing.png" (multiple copies, not investigated for hash match this pass)

`public/crafthub-landing.png`, `public/assets/smokecraft/crafthub-landing.png`,
`public/design-references/mvp2/crafthub/crafthub-landing.png`,
`public/smokecraft/images/crafthub-landing.png`,
`public/assets/smokecraft-reference/approved/Crafthub 360 landing page.png`,
`public/assets/pos360-reference/crafthub-360-landing-page.png`. None of
these are referenced by `CraftHub.jsx` (which uses only
`CRAFTHUB_IMAGE`, the venue-table-experience asset — CraftHub currently
has no separate "landing" sub-screen in the live route). **Not
hash-compared this pass** — flagged as a lower-priority cleanup item
since none of them affect production rendering (`CraftHub.jsx` never
imports any of them).

### Group 3 — small logo/badge duplicates (`crafthub-gauge-badge.png` in `pos3/`, `eat/`, `novi/`)

Same filename across 3 platform-module asset folders — plausibly
intentional (each module keeps its own copy of a shared badge asset
rather than a cross-module import), consistent with this repo's
generally flat, per-module `public/assets/<module>/` convention seen
elsewhere. Not flagged as a defect; not hash-compared this pass (low
relevance to CraftHub/SmokeCraft routes specifically).

## Summary

One real, actionable finding: the CraftHub "approved" reference folder
currently holds a mislabeled/wrong-content file under the correct
filename, which could mislead a future session into treating it as
authoritative. Production is unaffected. No deletions or moves performed
this pass, per instruction.
