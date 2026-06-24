# Uploaded Image Audit & Placeholder Replacement

## Goal restated

Audit all uploaded images, show every screen currently using them, and
replace genuine old images/placeholders/glyphs with the uploaded
images — cropping usable elements rather than dropping mockups/storyboards
onto screens as-is (per the chosen scope: "Crop usable elements only").

## Full inventory of uploaded reference images

15 root-level files in `public/` with descriptive uploaded-reference
names (not auto-generated screenshot/WhatsApp filenames):

| File | Content | Screens before this change |
|---|---|---|
| `360 PASSPORT NETWORK INTERFACE 2.png` | Passport Connections dashboard mockup w/ navy book + gold wax seal photo | None |
| `DIGETAL STAMP COLLECTION 1.png` | Stamp Collection mockup w/ isolated gold wax seal badge | None |
| `360 LUXARY STAMP COLLECT 2.png` | Near-duplicate stamp collection mockup, same wax seal | None |
| `360 PASSPORT CONNECTION 2.png` | Passport Connections mockup, same book+seal photo | None |
| `360 Passport 1.png` | Passport dashboard mockup (UI chrome, no standalone photo) | None |
| `360 passport  connections 11.png` | Passport dashboard + 5-tier passport-color book row | None |
| `360  passport connect  CONECTIONS.png` | Passport Connections mockup, same book+seal photo | None |
| `360 story board.png` | Multi-panel SmokeCraft ritual storyboard (S1→S5) | None |
| `SMOKECRAT STORY BOARD.png` | Multi-panel SmokeCraft storyboard, low-res per-panel | None |
| `STORY BOARD.png` | Duplicate of the above | None |
| `CRAFT HUB EXPLAIND.png` | NOVEE OS marketing/explainer infographic | None |
| `DECK, NOVEE OS.png` | 16-slide NOVEE OS investor deck grid | None |
| `DAYONE360 CONICERGE 1.png` | DayOne360 Concierge mockup — no matching module in this app | None |
| `SEED PARING 2.png` | Seed & Soil Pairing screen mockup w/ cigar product photo | None |
| `smokecraft Intake.png` | SmokeCraft Intake form mockup w/ lounge hero photo | None |

**Confirmed via `grep -rn "<filename>" src` for every one of the 15
files: none were referenced by any component before this change.** 6 of
the 15 were already catalogued as design-direction-only references in
`public/design-references/phase-7/README.md`, which explicitly states
they were used for "layout hierarchy, mood, texture, navigation pattern,
and interaction styling direction, not for 1:1 visual copying" — they
were never wired in as literal screen imagery.

## What was actually replaced (and why each one qualified)

Two components were found to be **hand-drawn SVG approximations of the
exact wax-seal badge that exists as real artwork in the uploaded
references** — these are the literal "placeholder standing in for real
art" case the task asked to fix, not a stylistic preference:

1. **`PassportStamp` in `src/pages/passport/PassportConnections.jsx`**
   (used at 3 call sites: the QR-scan "match found" state, the
   "Verifying Connection…" success state, and the main passport hero) —
   was a from-scratch SVG circle with curved `<textPath>` text drawn to
   *look like* a wax seal. The component even had a leftover developer
   note: `{ icon:'verified', label:'Update hero stamp', action: () =>
   setStatus('Hero stamp is SVG — edit PassportStamp component.') }` —
   an explicit acknowledgment this was a stand-in.
2. **`WaxSeal` in `src/pages/passport/PassportStamps.jsx`** (used on the
   "Your Stamp Collection" screen) — same pattern: an SVG radial-gradient
   circle with curved text built to simulate a wax seal.

Both were replaced with the same real cropped image:
`public/assets/passport/verified-seal.png`, cropped from the isolated
wax seal in `DIGETAL STAMP COLLECTION 1.png` (the cleanest, least
cluttered source of this exact badge — the same badge also appears,
less cleanly cropped, in `360 PASSPORT NETWORK INTERFACE 2.png`, `360
LUXARY STAMP COLLECT 2.png`, `360 PASSPORT CONNECTION 2.png`, and `360
 passport connect  CONECTIONS.png`).

Both components kept their existing `size` prop API, so every call site
needed zero changes beyond the component body — no layout, animation,
or business logic was touched.

## What was deliberately NOT replaced, and why

- **Tier Ladder badges in `PassportBenefits.jsx`** (circular star/lock
  icons keyed to this app's own tier names: Novice/Bronze/Silver/Gold/
  Diamond) were left untouched. The uploaded reference's 5-tier passport
  system (Ivory/Blue/Burgundy/Green/Black books, in `360 passport
  connections 11.png`) uses different tier names entirely. Swapping in
  that imagery would have silently changed the app's actual tier
  business logic/semantics, which this task explicitly must not do.
- **Storyboards, the investor deck, and the marketing infographic**
  (`360 story board.png`, `SMOKECRAT STORY BOARD.png`, `STORY BOARD.png`,
  `DECK, NOVEE OS.png`, `CRAFT HUB EXPLAIND.png`) are multi-panel
  mockups/decks, not single photographic elements. No screen in this app
  has a placeholder shaped like "drop in an entire slide deck page," so
  no insertion point exists without inventing one — per the "do not
  invent" rule, none was forced in.
- **`DAYONE360 CONICERGE 1.png`** — there is no DayOne360 module/screen
  in this codebase to receive it.
- **`SEED PARING 2.png` and `smokecraft Intake.png`** — both contain a
  usable cropped photo (a cigar product shot, and a lounge hero
  background respectively) that loosely match `SeedSoil.jsx` and the
  SmokeCraft intake flow by name. They were not used in this pass: both
  target screens already have real, on-brand local photography wired in
  from earlier phases (confirmed in the prior Phase 10 audit), and there
  was no glyph-only or SVG-placeholder gap on either screen to justify
  displacing existing real assets. Flagging here so they aren't lost if
  a genuine gap is found later.

## What was confirmed untouched

- SmokeCraft phase flow, Passport logic (XP/tier calculation, connection
  matching, stamp-earning rules) — untouched. Only the *rendering* of the
  wax-seal badge changed; no prop, state, or handler was touched.
- POS3/E.A.T. standalone rules, Novi Deployment Center logic, admin
  security — untouched (no files in those areas were edited).
- Vendor assignment preview / remote disable preview — untouched.

## Verification

```
npm run build
node server/scripts/verifyFounderAdminAccess.js
node server/scripts/verifyNoviDeploymentCenter.js
node server/scripts/verifyNoviRemoteDeploymentReadiness.js
node server/scripts/verifyReviewDeploymentCenterRoute.js
```

All pass (59/59 checks, unrelated to this change but confirming nothing
else regressed). Build succeeds; `/assets/passport/verified-seal.png`
verified to resolve with `200 image/png` from the dev server.
