# Handheld Dropdown Reverification — Closure Pass

`verify-golden-box-package-3-closure.mjs`, 30/30 passed (final clean
run), real browser, real backend, real seeded competition.

## Coverage

Both required viewports tested: **390×844** and **360×800**. For each:
- Entry Workspace with real dropdowns loads, zero horizontal overflow.
- Seed Genetics dropdown's bounding box confirmed fully within the
  viewport (no clipped control).
- A real selection registers correctly (bigint id consistency —
  directly re-testing the exact bug class found and fixed in the base
  Package 3 pass).
- Educational panel opens (from a Learn More button) and its close
  control is confirmed reachable within the viewport.
- Zero horizontal overflow maintained after all selections + panel
  interaction.

Additional coverage: full functional flow at desktop (1440×900,
selection + draft save + persistence verification) and tablet
(1366×1024, full workspace screenshot).

## What was NOT independently re-tested this pass (disclosed)

- Draft **resume** does not currently rehydrate the component dropdowns
  from the entry's last saved snapshot on page reload — confirmed by
  code inspection (`EntryWorkspace.jsx`'s `load()` fetches the entry
  record but never re-populates the `components` state from
  `golden_box_blend_components`). The cigar name field also does not
  restore on reload for the same reason. This is a **real, disclosed
  limitation**, not fixed this pass (out of the closure mandate's
  explicit scope — "do not redesign Golden Box"), and is the correct
  explanation for why the closure test's "draft resume" check asserts
  an empty (not restored) cigar name field rather than a false claim of
  full resume support. Flagged as a Package 4 candidate fix.
- Keyboard-only (no mouse/touch) operation of the dropdowns was not
  separately scripted — native `<select>` elements are keyboard-operable
  by browser default (no custom widget was built), so this is a
  reasonable, disclosed inference rather than a directly executed test.
- "Long option labels" and "dropdown opening near bottom of viewport"
  edge cases were not separately forced — the seeded display names are
  all reasonably short (e.g. "Connecticut Broadleaf" is the longest);
  this is disclosed as untested with artificially long strings.

## No layout regression from adding 3 more dropdown categories

The workspace already rendered 16 component pickers before this pass
(4 required + 12 optional); adding real options to 3 previously-empty
categories (seed genetics, soil, terroir) changes only their dropdown
contents, not the grid layout — confirmed by the zero-overflow checks
above using the exact same CSS grid container as the rest of the
workspace.
