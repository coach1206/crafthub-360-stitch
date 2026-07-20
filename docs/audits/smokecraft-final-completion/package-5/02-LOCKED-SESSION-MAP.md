# Package 5 — Locked Session Map

The mandate's proposed "Session 9 through Session 18" numbering does not
match this repository's actual locked spine (`src/constants/session.js`,
`VISIT_STRUCTURE`) — those numbers are already assigned to real, different,
verified content (e.g. Session 9 is merged into Session 8 "First Draw",
Session 12/13 is "Flavor Evolution"/"Construction Check"). Per the
mandate's own instruction ("If repository names differ, preserve the
repository names and document the mapping"), no session was renumbered or
reassigned.

**Decision**: Package 5 content is built entirely into the existing
`wrapper-strength` **supporting module** (`SUPPORTING_MODULES`, `requires:
'format'`), which already has a registered route
(`/smokecraft/wrapper-strength`) that today does nothing but redirect.
This is not a new route, not a new session, and not a 28th primary
session — it converts an existing dead stub into a real, live experience,
which is the least invasive interpretation of "map into the existing
session spine" available given the real registry.

- `TOTAL_SESSIONS` remains 27.
- `VISIT_STRUCTURE` is unchanged — zero edits to any of its 27 session
  entries.
- `SUPPORTING_MODULES`'s `wrapper-strength` entry is unchanged in
  `session.js` (same id, route, label, `requires` value) — only the
  component it renders (`WrapperStrength.jsx`) changes from a redirect
  stub to a real screen.
- Session 5 ("Construction Inspection", `format` route) is a separate,
  already-verified screen and was not touched.

All Leaf-to-Cigar sub-topics from the mandate (leaf primings, leaf
comparison, wrapper, binder, filler, long/short filler, filler
arrangement, bunching methods, binder application, molding/pressing,
wrapper application, cap construction, foot styles, the connected rolling
sequence, quality control/draw testing, curing, fermentation, aging,
sorting/grading, final resting/box aging) are delivered as sections within
this one screen — see `04-INTERACTION-INVENTORY.md` for the section
breakdown and `01-LEAF-CONSTRUCTION-EXPERIENCE-AUDIT.md`'s disclosed
consolidation rationale.
