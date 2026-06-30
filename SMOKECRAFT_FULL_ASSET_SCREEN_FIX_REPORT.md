# SmokeCraft Full Asset-Screen Fix Report

Generated: 2026-06-30
Branch: claude/beautiful-thompson-r3mm5m
Viewport tested: 1024×768 (tablet/touchscreen landscape)

---

## A. What Changed

New component: `src/components/smokecraft/SmokeCraftAssetScreen.jsx`
- Fixed, full-viewport (`position:fixed; inset:0; 100vw/100vh`) container.
- Renders the approved image **twice**: a blurred/dimmed/scaled copy as background fill (`objectFit:cover`, `blur(26px)`, `scale(1.08)`, `opacity:0.42`) to eliminate dead dark space when the aspect ratio doesn't fill the viewport, and the crisp image on top with `objectFit:contain` (never `cover`, never cropped).
- No title bar, no header, no children/controls slot — the approved image is the entire screen.

16 SmokeCraft routes converted to render **only** `SmokeCraftAssetScreen`, wrapped in a tap-anywhere `<div onClick=...>` that preserves the original navigation call (and, where applicable, the original `completeStep`/`addXP`/`updateProfile` calls) without any visible button/form/chrome:

| Page | Route | Old chrome removed |
|---|---|---|
| Art | `/smokecraft/art` | title-bar canvas + 2 buttons |
| HowItWorks | `/smokecraft/how-it-works` | title-bar canvas + 2 buttons |
| FlavorMemory | `/smokecraft/flavor-memory` | title-bar canvas + chip picker + 2 buttons |
| SmokeCraftChallenge | `/smokecraft/smokecraft-challenge` | title-bar canvas + Q&A UI + 2 buttons |
| SecondHumidorMatch | `/smokecraft/second-humidor-match` | title-bar canvas + choice cards + 2 buttons |
| MiniTastingRound | `/smokecraft/mini-tasting` | title-bar canvas + chips/rating + 2 buttons |
| FinalReview | `/smokecraft/final-review` | title-bar canvas + chips + 2 buttons |
| PairingLab | `/smokecraft/pairing-lab` | title-bar canvas + choice cards + 2 buttons |
| GuestPass | `/smokecraft/guest-pass` | full page header + form card |
| Scan | `/smokecraft/scan` | full page header + form card |
| FirstThird | `/smokecraft/first-third` | fixed header, progress strip, tasting form, sidebar |
| SecondThird | `/smokecraft/second-third` | fixed header, progress strip, tasting form, sidebar |
| FinalThird | `/smokecraft/final-third` | fixed header, hero text, tasting form, sidebar |
| Terroir (via ComingSoon) | `/smokecraft/terroir` | atmospheric bg, premium header, bottom nav |
| Vitola (via ComingSoon) | `/smokecraft/vitola` | atmospheric bg, premium header, bottom nav |
| PairingMastery (via ComingSoon) | `/smokecraft/pairing-mastery` | atmospheric bg, premium header, bottom nav |

`ComingSoon.jsx` now short-circuits to a bare `SmokeCraftAssetScreen` the moment a `referenceImage` prop is supplied, before any of `SmokeCraftAtmosphericBackground` / `SmokeCraftPremiumHeader` / `SmokeCraftBottomNav` render.

**Scoring tradeoff (explicit, per "no functional controls/forms in this pass"):** Pages that previously had answer-dependent or input-dependent XP (`SmokeCraftChallenge`, `FirstThird`, `FinalThird`) now call `addXP` with the same value the formula returns when no input is given (the "no answers / no notes" floor: 75 for the challenge, 5 for First/Final Third). `GuestPass`/`Scan` no longer collect a manual venue code (entering one was optional convenience, not required for `navigate`/`updateProfile` flow). No scoring formula, route target, or session-gate logic was edited — only the input UI that fed it was removed, since the rule explicitly forbids any visible control sitting over the image in this pass.

## B. Out of Scope (left as Round B viewport-fit state, not converted)

These pages are multi-destination functional hubs or multi-selection forms with several distinct navigation targets and/or live session data (leaderboard links, POS purchase-intent creation, mentor multi-select, passport detail cards, etc.) — collapsing them into a single tap-to-continue image would delete real navigation, not just chrome, and risks the "do not change route flow" constraint. They keep the approved image as the in-page hero (already `objectFit:contain`, no cropping) but the surrounding functional layout remains: `EventChallenge.jsx`, `SessionComplete.jsx`, `Origins.jsx`, `GoldenBoxStatus.jsx`, `Pairing.jsx`, `Mentor.jsx`, `Identity.jsx`. Also unchanged (decorative-background pattern from Round B, never image-as-screen pages to begin with): `Connections.jsx`, `CutToastLight.jsx`, `Enroll.jsx`, `FlavorDNA.jsx`, `GoldenBox.jsx`, `HumidorMatch.jsx`, `ManagementSync.jsx`, `PassportStamp.jsx`, `RequestPurchase.jsx`, `Scorecard.jsx`, `SeedSoil.jsx`.

## C. Proof

Build: `npm run build` — succeeds, no errors.
Proof folder: `public/proof/smokecraft-full-asset-screen-proof/` — 16 screenshots + `results.json`, captured at 1024×768 with `hasTouch:true`, demo-mode session injection.
All 16 pages: foreground image present with `objectFit:contain`, no JS errors, no page chrome around the image — only the persistent app-wide "Demo Mode Active" badge (unrelated infrastructure overlay, present site-wide, not page-specific chrome).

**Pre-existing, out-of-scope note (already flagged in the prior round, confirmed again here):** the approved PNGs for `first-third`, `second-third`, and `final-third` (and a few ComingSoon-routed ones) contain baked-in design content that doesn't literally match the route's step name (e.g. the `first-third` asset's baked-in design reads "Final Third — Tasting"). No image files were touched — this is asset-content, not layout.

## D. Safety

No SmokeCraft scoring formulas, auth, session gate, backend, POS360, E.A.T., NOVEE, or route targets were changed — only the visible UI was replaced with the approved image. Demo mode session injection via Playwright `addInitScript` only, no production bypass committed.

The approved SmokeCraft images now render directly as the page screen.
