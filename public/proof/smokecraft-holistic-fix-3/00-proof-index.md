# Holistic Fix 3 — Proof Index

Starting commit: `941676c7`

## What this proof directory covers

**System-wide responsive audit and closure** across all 108 routes at 5
viewports (handheld portrait 390×844, 10" tablet landscape 1280×800, 12"
tablet landscape 1366×1024, 15" display 1440×900, desktop 1920×1080).

- `01-responsive-inventory.json` — the final, corrected sweep: per
  route/viewport measured facts (horizontal overflow, scroll capability
  including native document/body scroll, hero-image orientation/size/
  object-fit, bottom-nav clearance, dead-space ratio, minimum touch
  target, minimum font size). Produced by
  `verify-smokecraft-hf3-responsive-inventory.mjs`.
- `screenshots/` — one screenshot per route at the primary 10" tablet
  landscape viewport (1280×800), captured during the same final sweep.

## Investigation history (measurement bugs found and corrected before trusting the data)

Three rounds of live re-verification found and fixed real bugs in the
**sweep script itself** before its output was trusted as ground truth —
consistent with this operation's standing rule to distinguish test-harness
artifacts from real product defects:

1. **Scroll-blocked false positives (9 hits)** — the sweep only checked
   for descendant elements with explicit `overflow-y:auto/scroll`, missing
   native document/body scroll (the default, working mechanism most
   screens rely on). Fixed by attempting a real `window.scrollTo` and
   checking it moved.
2. **Obscured-control false positives (dozens of hits, two distinct
   causes)** — (a) a fixed bottom nav's own buttons were being counted as
   "obscured by the nav"; (b) any control merely below the fold on
   initial unscrolled load was flagged, when it was actually reachable
   by scrolling (confirmed live on `/smokecraft/mentors`: 4 mentor cards
   sat below the fold at scroll-top=0 but were fully visible and
   reachable once scrolled). Fixed by excluding a nav's own children and
   by excluding any control with a scrollable ancestor. A third false-
   positive source was found afterward: the "fixed bottom element" probe
   matched *any* small fixed element near the viewport bottom (a toast,
   a decorative watermark, an image-shell hotspot band), not just a real
   nav bar — confirmed via source read of `src/pages/SmokeCraft.jsx`
   that the flagged Rewards/Rankings/Passport/CraftHub buttons are
   percentage-positioned hotspots over the landing page's own approved
   baked hero image, not covered by anything. Scoped detection to
   `role="navigation"` (the exact markup `SmokeCraftNavBar.jsx` renders).
3. **Hero-image stretch false positives** — the original check flagged
   any hero image whose rendered aspect ratio differed from its natural
   ratio, which is a false positive for legitimate `object-fit:'cover'`
   hero banners (crops without distorting pixel proportions). Fixed by
   reading the computed `object-fit` and only flagging a mismatch when
   it is neither `'contain'` nor `'cover'`.

## Real product defects found and fixed this pass

1. **`SmokeCraftVenueCommerce.jsx` two-column grid overflow** — a fixed
   `'1fr 280px'` grid template caused genuine horizontal overflow (116px)
   at handheld-portrait width on all three routes that render this
   component (`/venue-commerce`, `/order`, `/ticket-tapper/staff-specials`).
   Fixed with a shared `.sc-commerce-two-col` CSS class
   (`src/styles.css`) that collapses to a single stacked column below
   820px. Verified live: 0px overflow post-fix on all three routes.
2. **`Connections.jsx` image stretch** — declared `NAT_W=1672,
   NAT_H=941` (landscape) for `SC_ASSETS.connections`
   (`cropped/connections-hero.jpg`), whose real file is 492×781
   (portrait, confirmed via PIL). The wrong declared dimensions fed
   `SmokeCraftImageBoundsOverlay`'s scale math incorrectly, genuinely
   stretching/distorting the rendered image on every viewport (computed
   `object-fit: fill` with a badly mismatched box). Fixed by correcting
   `NAT_W`/`NAT_H` to the asset's real dimensions — the image now
   letterboxes correctly (`object-fit`-equivalent `contain` math) with
   no distortion. Cross-checked all other 27 image-shell screens'
   declared dimensions against actual file bytes; this was the only
   mismatch found.

## Known, pre-existing, disclosed non-defects (not silently dismissed)

- **5 portrait assets remain portrait on landscape viewports**: `enroll`
  (guest pass), `connections`, `pairing`, plus the mentor-selection
  avatar thumbnail and the venue-commerce menu backdrop. All are
  rendered via `SmokeCraftImageBoundsOverlay`'s `contain`-equivalent
  math — safely letterboxed, never stretched or cropped in a way that
  removes information. This matches the pre-existing, already-disclosed
  `SC-D002` finding (`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`): these
  assets are flagged for horizontal replacement (new artwork), which is
  out of scope for this pass (no substitute artwork was fabricated, per
  the mandate's explicit instruction not to generate replacement
  imagery silently).
- **Golden Box dynamic-route (`:competitionId`/`:entryId`) transient
  overflow during early sweep runs** — investigated by direct live
  re-check on 3 sampled dynamic routes with a longer settle wait; did
  not reproduce. Root-caused to sweep-timing (a loading/transition state
  caught mid-render before this pass's settle-wait fix), not a real
  layout defect.

## Coverage summary

- **Total routes tested**: 108 of 108, all 5 viewports.
- **Horizontal overflow**: 0 remaining (3 routes fixed, 1 shared root
  cause).
- **Scroll-blocking**: 0 confirmed real (all flagged cases were
  measurement-script bugs, corrected and re-verified).
- **Bottom-nav obscuring**: 0 confirmed real (all flagged cases were
  measurement-script bugs, corrected and re-verified).
- **Stretched/distorted images**: 0 remaining (1 real defect fixed).
- **Portrait heroes on tablet**: 5, all safely letterboxed (no stretch,
  no crop of important content), all pre-existing and disclosed,
  flagged for horizontal-replacement artwork out of this pass's scope.
- **`scripts/validateSmokecraftResponsive.mjs`**: new build-blocking
  validator, PASS, 0 failed checks, wired into `npm run build`'s
  prebuild chain.

## What this proof directory does NOT cover

- New replacement artwork for the 5 disclosed portrait assets (explicitly
  out of scope — no substitute imagery was fabricated).
- Per-control typography/touch-target remediation below the mandate's
  practical-size guidance — the inventory measures these per route/
  viewport, but a full pass fixing every small decorative label or badge
  across 108 routes was not attempted; the validator's checks focus on
  the mandate's core failure classes (overflow, scroll-blocking, nav
  obscuring, image distortion) that were confirmed as real, systemic, and
  fixable via shared primitives.
- Gameplay-engine, POS360, or E.A.T. work (explicitly excluded).
