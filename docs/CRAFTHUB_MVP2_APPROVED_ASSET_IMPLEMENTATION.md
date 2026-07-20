# CraftHub MVP2 — Approved Asset Implementation

Supersedes the "no approved visual exists" conclusion in
`docs/CRAFTHUB_MVP2_DEEP_RECOVERY_AUDIT.md` — a new approved image was
uploaded directly to `recovery/smokecraft-codex-final` after that audit
completed. This document records the implementation built from it.

## Source of truth

- Remote commit: `54d678da7092ca20d16f211972be4ea1640e926c` (author
  `COACH1206`, a real human commit, not an automated/agent commit)
- Exact path: `public/assets/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`
- Dimensions: 1672×941, PNG, 8-bit/color RGB
- SHA256: `ceb58ced9306ee71933dc7b348918a2b822ba33714dcadbd7f60f257f210ea72`
  — verified identical between the remote object (`git cat-file -p
  origin/recovery/smokecraft-codex-final:...`) and the file extracted into
  the local working tree.
- Extraction method: single-file `git cat-file -p <remote-ref>:<path> >
  <path>` — no merge, checkout, reset, or broad branch pull was performed;
  all other local uncommitted changes were untouched (confirmed via
  unchanged `git diff --stat` on every other file, before and after).

This is a **different, distinct file** from the two candidates found during
the deep recovery audit — confirmed by differing SHA256 hashes against
`public/assets/smokecraft-reference/approved/CRAFTHUB 360. VENUE TABLE
EXPERIENCE.png` (`5d541239...`) and `Crafthub 360 landing page.png`. This
new upload contains no fabricated "Venue Signals" metrics section (unlike
`Crafthub 360 landing page.png`, which baked in the exact `Active Tables:
12` / etc. values already removed from `CraftHub.jsx` in the prior
package) and includes the Staff Handoff / DayOne360 banner row.

## Zone map (Phase 3)

| Region | Bounds (% of 1672×941) | Classification |
|---|---|---|
| Back to NOVEE OS pill | left 4.0%, top 1.7%, w 13.6%, h 6.8% | LIVE CONTROL |
| Home pill | left 19.7%, top 1.7%, w 6.7%, h 6.8% | LIVE CONTROL |
| CRAFTHUB 360 wordmark (header, center) | — | PERMANENT BRANDING |
| DayOne360 Travel pill | left 61.9%, top 1.7%, w 10.4%, h 6.8% | LIVE CONTROL |
| Demo Mode pill | left 72.8%, top 1.7%, w 10.7%, h 6.8% | LIVE CONTROL |
| 360 Passport Connections pill | left 84.0%, top 1.7%, w 13.8%, h 6.8% | LIVE CONTROL |
| Hero title/subtitle/crown mark | left 14%, top 16%, w 70%, h 14% | PERMANENT DECORATIVE |
| SmokeCraft 360 card | left 7.5%, top 33.0%, w 16.2%, h 37.5% | LIVE CONTROL (active) |
| PourCraft 360 card | left 24.3%, top 33.0%, w 16.1%, h 37.5% | LIVE CONTROL (Coming Soon — honestly labeled, routes to real stub) |
| WineCraft 360 card | left 41.1%, top 33.0%, w 16.2%, h 37.5% | LIVE CONTROL (Coming Soon) |
| BeerCraft 360 card | left 58.6%, top 33.0%, w 16.2%, h 37.5% | LIVE CONTROL (Coming Soon) |
| 360 Passport Connections card | left 76.1%, top 33.0%, w 15.6%, h 37.5% | LIVE CONTROL (active) |
| Module card photography/icons/description text | — | PERMANENT DECORATIVE (real, honest copy — cigar/cocktail/wine/beer/passport photography, matches each module's real purpose) |
| Enter CraftHub pill (bottom nav) | left 8.8%, top 72.0%, w 21.6%, h 7.8% | LIVE CONTROL |
| Staff Handoff pill (bottom nav) | left 30.3%, top 72.0%, w 19.7%, h 7.8% | LIVE CONTROL |
| 360 Passport Connections pill (bottom nav) | left 49.9%, top 72.0%, w 19.0%, h 7.8% | LIVE CONTROL |
| DayOne360 Travel pill (bottom nav) | left 69.0%, top 72.0%, w 21.8%, h 7.8% | LIVE CONTROL |
| Staff Handoff banner | left 3.2%, top 81.5%, w 46.0%, h 16.7% | LIVE CONTROL |
| DayOne360 Travel banner | left 50.5%, top 81.5%, w 46.3%, h 16.7% | LIVE CONTROL |

**No baked metrics, connected/live status, user information, or selected
state anywhere in this image** — every visible number/label is either
permanent decorative copy (module descriptions) or a control. Nothing
required neutralizing or masking; this image, unlike the two mockups found
during the deep audit, does not bake in fabricated dynamic data.

## Implementation

`src/pages/CraftHub.jsx` was rebuilt to render this image full-bleed via
the existing, already-verified `SmokeCraftImageBoundsOverlay` component
(same component used by the SmokeCraft Launch screen — no new abstraction
introduced), with 16 real transparent-at-rest `<button>` hotspots
positioned at the zone-map bounds above. Old centered card-grid Tailwind
implementation (parallax photo tiles, Material Symbols icons, custom
header/hero/footer markup) fully replaced.

### Fixed action bar conflict found and corrected

`src/components/Layout.jsx` renders a site-wide `TicketTicker` banner on
every route except `/smokecraft/*` (already suppressed there with the
documented reason: "the venue ticker competes with the hero for attention").
`/crafthub` was not in that exclusion list, so the ticker rendered on top of
the new full-bleed image's own baked header row — a direct violation of
this task's rule 22 ("do not cover approved content with fixed action
bars"). Fixed by extending the existing `hideTicker` condition to include
`/crafthub`, mirroring the established `/smokecraft` precedent exactly (one
line changed, no new logic pattern introduced).

### Live control behaviors (unchanged from the prior implementation)

- SmokeCraft card → `navigate('/smokecraft')`
- Passport Connections (header, card, bottom nav) → `navigate('/passport/connections')`
- Staff Handoff (bottom nav, banner) → opens the existing real
  `StaffHandoffButton` PIN modal, unchanged
- Back to NOVEE OS → `navigate('/')`
- Home → `navigate('/home')`
- DayOne360 Travel (header, bottom nav, banner) → `window.open('https://dayone360.com', ...)`
- Demo Mode → existing `enterDemoMode()` + `navigate('/smokecraft')`
- PourCraft/WineCraft/BeerCraft → `navigate('/pourcraft')` / `/winecraft'` /
  `/beercraft'` (unchanged routes to their real, honest Coming Soon stub
  pages — never claims to be active)
- Enter CraftHub (bottom nav) → `navigate('/crafthub')` (unchanged — this
  self-referential label/route existed in the prior implementation too)

No API calls, `GuestSessionContext`/journey state, Staff Handoff PIN logic,
or route targets were altered beyond what is listed above. No reward, XP,
or state mutation occurs on page load — confirmed by test.

## Touch target fix

Header pill hotspots initially measured 44px tall at 1440×900 (matching the
image's own native pill height at that render scale) — under the 48px
minimum required by this task. Padded the hotspot bounds (not the visible
baked pills) from 5.4% to 6.8% height, keeping the same vertical center, to
guarantee ≥48px at every required viewport including the smallest
(1280×800). Verified via direct `getBoundingClientRect()` measurement.

## Confirmation: `PublicSessionNotice` bottom-right badge is not a defect

A small "Public demo mode active" indicator (bottom-right,
`pointer-events: none`) appears on `/crafthub` — this is a pre-existing,
unrelated, intentional component (`src/components/PublicSessionNotice.jsx`)
explicitly scoped to `['/', '/boot', '/home', '/crafthub']` as an honest,
non-blocking confirmation that no backend auth session exists on public
routes. It does not overlap any hotspot (`pointerEvents: none`) and was not
introduced or modified by this package.

## Tests

`verify-crafthub-approved-image.mjs` (new, 22/22 passing) — approved image
in use, old grid gone, no fabricated metrics, all 6 named controls work,
Coming Soon honesty, no invisible hotspots, no broken images, no duplicate
text, 4-viewport no-overflow, 48px+ touch targets, keyboard focus, refresh
survival, no new console errors. Full regression battery re-run clean (see
final report).

## Proof

`public/proof/crafthub-approved-venue-table-experience/` — approved source
image, zone-map overlay, live screenshots at all 4 required viewports plus
native resolution, navigation-action proofs, Coming Soon proof, no-
fabricated-metrics text+screenshot proof, no-duplicate-text crop, keyboard
focus proof.
