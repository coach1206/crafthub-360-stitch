# Test Evidence — Package 2

## Environment

Disposable local PostgreSQL 16 (`crafthub_pkg2_probe`), 78 migrations
applied, real Express server (port 3001), real `vite dev` server (port
5000, required for the live `/api` proxy per this repo's established
convention for browser-driven live-API tests), real Playwright/Chromium.

## `verify-golden-box-package-2.mjs` — 22/22 passed (final clean run)

Real browser flow, real guest identity (server-issued JWT), real seeded
competition: Hub loads real data → dynamic mentor guidance (not
hardcoded) → competition detail → real eligibility evaluation → real
entry creation (DB-verified) → educational detail panel (contract
fields verified) → real draft save (DB-verified version increment) →
draft review with real validation state → submission blocked until
explicit checkbox acknowledgment → real server-side lock on submit →
locked-state messaging → results screen links to the existing
Leaderboard/Rewards (not rebuilt) → no new console errors → zero
horizontal overflow at 3 tablet viewports → AI-analysis route enforces
entry ownership (Package 1 review follow-up, confirmed 403 for an
unrelated caller) → Venue Management unaffected → full cleanup.

## Real bugs found and fixed this package

1. **Guest-identity cookie path too narrow**: the SmokeCraft guest
   cookie was scoped to `/api/smokecraft/management-sync` only
   (`server/middleware/smokecraftGuestIdentity.js`), so the browser
   never sent it to `/api/smokecraft/golden-box/*` requests, causing
   every authenticated Golden Box call to fail with 401 despite a valid
   guest session existing. Fixed by broadening the cookie path to
   `/api/smokecraft` (still SmokeCraft-scoped, not app-wide) — both
   Management Sync and Golden Box reuse this same identity system by
   design, so this is a compatibility fix, not a new identity scheme.
2. **`ensureIdentity()` not called before eligibility/entry-creation
   API calls** in the frontend hooks — related to bug 1's discovery;
   fixed by calling it in `checkEligibility`, `useGoldenBoxEntry.load`,
   and `CompetitionDetail`'s `handleCreateEntry`.
3. Two test-script bugs (not application bugs): Playwright's
   case-insensitive `text=` locator matched "Not yet selected" body text
   before ever reaching the actual "Select" buttons — fixed by switching
   to `getByRole('button', { name: 'Select', exact: true })`; and a
   cleanup FK-order bug (deleting `entry_versions` before the
   `submissions` row that references them) — fixed by reordering
   deletes.

## Console warning investigated, confirmed pre-existing

A React dev-mode warning ("Cannot update a component while rendering a
different component," originating in `SmokeCraftSessionGuard.jsx`) fires
on navigation into the new Golden Box routes. Investigated: `Entry
Workspace`/`Hub`/etc. do **not** use `SmokeCraftSessionGuard` at all —
the warning originates from the guard's pre-existing `navigate()`-in-render
pattern on an *adjacent* route during the transition, confirmed
independent of any Package 2 file content. Filtered from the "new
console errors" assertion with the investigation documented inline in
the test script, not silently ignored.

## Regression suites re-run this package

| Suite | Result |
|---|---|
| `npm run build` | PASS |
| `verify-golden-box-package-1.mjs` | 36/36 passed |
| `verify-venue-management-command-hub-package-6b.mjs` | 33/33 passed |

## Cleanup

Test database dropped; Express, vite dev, and local PostgreSQL 16 all
stopped; `dist/` and temp logs removed.

## Addendum — Package 2 closure pass (this update)

`verify-golden-box-package-2-closure.mjs` — **23/23 passed** (final
clean run): full handheld-portrait flow (390×844) through all 9 named
states (hub → competition detail → eligibility → blend builder →
educational modal → draft review → submission confirmation → entry
status → results), a narrower 360×800 spot check, tablet10/12/15 +
desktop hub checks, and 3 mentor-portrait checks (real image renders,
alt text present, honest unassigned state). Zero horizontal overflow at
every viewport; every interactive control (Create My Entry, modal close,
Submit Entry) verified to have its full bounding box within the
viewport, not just "present in the DOM."

### Real bug found and fixed this closure pass

`MentorGuidancePanel.jsx` assumed `journey.mentor` was a single object
with an `imageAssetKey` field; the real shape (set by
`Mentor.jsx:94`, `setMentor(mentors.length ? mentors : null)`) is an
**array** of full roster records from `smokeCraftMentors.js`, each
already carrying a real approved `image` path. Fixed by reading
`mentorList[0]` and rendering that real path via `MediaSlot`'s new
`directSrc` prop. Found by writing a realistic seed fixture matching
production's actual data shape, not by inspection alone — the previous
Package 2 test suite's simplified single-object mentor fixture had
masked this bug.

### Full regression re-run (fresh server, single clean pass)

| Suite | Result |
|---|---|
| `npm run build` | PASS |
| `verify-golden-box-package-2.mjs` | 22/22 passed |
| `verify-golden-box-package-1.mjs` | 36/36 passed |
| `verify-venue-management-command-hub-package-6b.mjs` | 33/33 passed |

### Cleanup (closure pass)

Test database (`crafthub_pkg2c_probe`) dropped; Express, vite dev, and
local PostgreSQL 16 stopped; `dist/` and temp logs removed. Screenshot
proof retained at `public/proof/smokecraft-package-2/` (not cleaned up —
it is the deliverable).
