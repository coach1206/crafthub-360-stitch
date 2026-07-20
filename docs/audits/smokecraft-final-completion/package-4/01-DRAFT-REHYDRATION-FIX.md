# Package 4, Step 2 — Draft Rehydration Fix

## The bug (disclosed at Package 3 closure)

`EntryWorkspace.jsx`'s `load()` fetched the entry record on mount but never
restored `components` state or `cigarName` from the previously saved draft.
Confirmed by code inspection at Package 3 closure; the API itself never
returned the saved snapshot either, so there was no data path to rehydrate
from even if the frontend had tried.

## The fix

1. **`server/controllers/goldenBoxController.js` — `handleGetEntry`**: when
   the caller has recipe-view access, now also fetches the entry's
   `currentVersion` (`entryService.getCurrentVersion`) and its saved
   `components` (`entryService.getBlendComponents`) and includes both in the
   response. Both service functions already existed from Package 1; they
   were simply never called from this controller.
2. **`src/hooks/useGoldenBox.js` — `useGoldenBoxEntry`**: now also stores
   `savedComponents` (the raw `golden_box_blend_components` rows) from the
   API response.
3. **`src/pages/smokecraft/goldenBox/EntryWorkspace.jsx`**: a new `hydrated`
   guard state plus a `useEffect` that, once the entry, its saved
   components, and the real catalog are all loaded, restores `cigarName`
   from `entry.cigar_name` and reconstructs the `components` selection map
   by matching each saved component's `component_value.catalogId` against
   the already-fetched catalog rows using `String(r.id) === String(catalogId)`
   (the same bigint-as-string comparison pattern fixed earlier in Package
   3). Runs once per mount so it never clobbers in-progress local edits on
   a later re-render.

No privacy logic was touched — `visibilityService.getVisibility` still gates
whether `currentVersion`/`components` are included in the response at all;
callers without `canViewRecipe` still receive only the bare entry status.

## Test evidence

New suite: `verify-golden-box-package-4-rehydration.mjs`, run against a
disposable Postgres 16 database (`crafthub_pkg4_probe`), real Express
server, real `vite dev`, real Playwright/chromium — **14/14 passed**:

- Draft created, 7 components selected, cigar name set, saved (version 2)
- Page reload: cigar name, seed genetics, soil, and all other saved
  selections (terroir/wrapper/binder/filler/vitola) rehydrate correctly
- One selection (seed genetics) edited and saved again (version 3)
- Second reload: the edited selection rehydrates to its new value (not the
  original), cigar name still correct
- Owner (guest A) can still view their own recipe via the API, and the
  response now includes `currentVersion` + non-empty `components`
- A second, distinct guest (guest B) requesting the same entry still gets
  `canViewRecipe: false` and no `components`/`currentVersion` in the
  response — recipe privacy enforcement unaffected by the fix

Full regression re-run in the same session (single consolidated shell
invocation per the sandbox-stability workaround discovered in Package 3
closure):

- Package 1: 36/36
- Package 2: 22/22
- Package 3 (base): 16/18 — 2 fixture-data mismatches from this session's
  disposable-DB seeding order (seed script inserts base+closure content
  together under one `created_by`, so the base-only count of 34 no longer
  matches; the same substantive-content and API checks all pass). Not a
  code regression.
- Package 3 (closure): 29/30 — the 1 "failing" assertion is the closure
  script's own line 121, which explicitly asserted the **old, broken**
  behavior (`reloadedCigarName === ''`) as a documented disclosure of this
  exact bug. With the bug now fixed, the cigar name correctly rehydrates,
  so that specific old assertion is now stale by design — superseded by
  this package's new rehydration suite, left in place rather than edited
  since editing a prior package's proof script after the fact would blur
  the historical record.
- Venue Management: 33/33

Build not re-run this step (no build-affecting change — controller/hook/
component logic only); will be re-verified in the Package 4 final test
pass (Step 21).

## Files changed

- `server/controllers/goldenBoxController.js` (additive, `handleGetEntry` only)
- `src/hooks/useGoldenBox.js` (additive, `useGoldenBoxEntry` only)
- `src/pages/smokecraft/goldenBox/EntryWorkspace.jsx` (additive, new rehydration effect only)

No migrations, no protected files touched.
