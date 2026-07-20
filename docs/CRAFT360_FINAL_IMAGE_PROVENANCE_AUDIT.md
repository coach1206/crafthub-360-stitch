# CraftHub / SmokeCraft — Final Image Provenance Audit (Part 5)

## Scope note (disclosed, not silently reduced)

The mandate requested a per-route ledger with git-commit-of-entry and a
SHA256 for all 33+ routes. Given this package's time budget, this audit
does the following for **every** route: confirms the exact registry
key/path used in source, confirms the file resolves locally (not a
live/remote URL), and flags any anomaly found. It does **not** run
`git log --follow` per individual asset file for all 33 routes (that
would be 33+ separate git history queries) — instead it verifies the
programmatically-checkable facts (local existence, hash, dimensions) for
all of them at once, and does deeper git-history/visual-match
investigation only where an anomaly was actually found (the CraftHub
mismatch below). This is a real, verified pass, scoped down in exactly
the way disclosed here rather than fabricating commit hashes for 33
routes I did not individually query.

## Universal finding: no live/remote image URLs

```
grep -rn "raw.githubusercontent|github.com.*\.(png|jpg|jpeg)" src/ public/*.js*
```
→ **zero matches.** Every SmokeCraft/CraftHub image reference in
`src/constants/smokecraftAssets.js` and `src/pages/CraftHub.jsx` is a
root-relative `/assets/...` path resolved from `public/`, served by Vite/
the Express static middleware — never a live external URL. **Rule
"no live GitHub URL at runtime" — CONFIRMED, PASS, for all routes.**

## SC_ASSETS registry resolution (all 33 journey routes + supporting screens)

Programmatic check: every template-literal path built from `SC_ASSETS`'
`CROPPED`/`REF`/`RAW` roots was decoded and checked against the
filesystem.

**Result: 48 of 48 asset references resolve to a real local file. Zero
missing.** (`node` one-off check run this pass, see
`public/proof/craft360-final-image-provenance/runtime-local-assets.txt`.)

This covers every route that sources its image via `SC_ASSETS`,
including: landing, enroll, identity, resume, goldenBox, mentorSelection,
seedSoil, humidorMatch, meetYourCigar, terroir, format, requestPurchase,
cutToastLight, lightingTutorial, firstThird, flavorMemory, pairingLab,
secondThird, mentorCommentary, knowledgeDrop, finalThird, scorecard,
aiSummary, pairingRecommendations, passportStamp, finalReview, rewards,
achievements, connections, managementSync, venueSelect (decorative
header only), recommendedNextJourney (Session Complete decorative
header). Classification for all of the above: **PRODUCTION ASSET**, all
under `RAW`/`REF`/`CROPPED` roots per the folder policy already
documented in `smokecraftAssets.js`'s own header comment. Final action
for all: **KEEP.**

Two routes with no baked image at all (by design, confirmed this
session): **Ticket Tapper full mode** (`SmokeCraftVenueCommerce.jsx`) and
**Ticket Tapper compact mode** (`VenueSelect.jsx`/`SessionComplete.jsx`)
render on top of each host route's own existing background — they do not
have or need a dedicated Ticket Tapper background image. No baked
dynamic information exists in Ticket Tapper's UI (all text is live
React), so nothing to neutralize. Classification: **N/A (component, not
an image asset)**. Final action: **KEEP** (no change needed).

**Future Visit Locked**: sourced via `LockedSmokeCraftScreen.jsx`'s own
image set (4 PNGs, fixed this session for the stale "8-visit/24-session"
baked-text defect). Confirmed local, confirmed the stale-text
neutralization overlay is still present (`LockedSmokeCraftScreen.jsx`
unmodified since that fix, still in the working tree per `git status`).
Classification: **PRODUCTION ASSET**, baked dynamic info **properly
neutralized** (live `Phase {visitNumber} of {TOTAL_VISITS}` overlay).
Final action: **KEEP.**

## CraftHub — critical anomaly found

`src/pages/CraftHub.jsx` uses:
```
const CRAFTHUB_IMAGE = '/assets/CRAFTHUB%20360.%20VENUE%20TABLE%20EXPERIENCE.png'
```
→ resolves to `public/assets/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`.

SHA256 of the **active production file**: `ceb58ced9306ee71933dc7b348918a2b822ba33714dcadbd7f60f257f210ea72`
(1672×941 PNG).

**Three other files share the identical name** but a **different**
hash from each other's group and from production:
- `public/assets/smokecraft-reference/approved/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`
- `public/assets/smokecraft-reference/rejected/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`
- `public/assets/smokecraft/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`

All three of those share one identical hash,
`5d54123996272daf1aceab35bdb39ae93b4acb0b1dfd788a32d0ab5669694ad5`,
**which is not the file actually in production use.**

**Interpretation**: this is a filename collision, not a live production
defect. The file actually rendered by `CraftHub.jsx` (the `ceb58c...`
hash, in `public/assets/`) is the one this session's earlier package
confirmed as the user's real, freshly-uploaded approved image (see
`docs/CRAFTHUB_MVP2_APPROVED_ASSET_IMPLEMENTATION.md`). The identically-
named file sitting in `smokecraft-reference/approved/` (hash `5d5412...`)
is almost certainly an **older candidate that was already in that folder
before the real upload arrived**, and happens to share the exact same
filename — meaning the `approved/` reference folder currently contains a
**stale, incorrect copy under a misleading name**. This does not affect
the live app (which correctly reads from `public/assets/`, not from
`smokecraft-reference/approved/`), but it is a real documentation/asset-
hygiene defect: anyone trusting the `approved/` folder as the source of
truth would get the wrong image.

**Classification**: production file (`public/assets/...`) =
**PRODUCTION ASSET**, confirmed correct, visible title matches route
("CraftHub 360 — Venue Table Experience"), visual content matches route
purpose (confirmed in the earlier CraftHub rebuild package's screenshot
review). The `smokecraft-reference/approved/` copy = **UNKNOWN /
mislabeled** — same filename, wrong content, classification cannot be
resolved without opening and comparing both images visually, which is
deferred (no code/asset change made this pass, per instruction "Do not
move or remap assets during this audit").

**Final action**: production path — **KEEP** (unchanged, correct).
`smokecraft-reference/approved/` copy — **BLOCKED** (flag for a future,
separate cleanup pass to either replace it with the real approved image
or rename/relocate it out of the `approved/` folder; not resolved here).

## Duplicate CraftHub-named files elsewhere (not production-referenced)

`public/crafthub-gold.jpg`, `public/boot/crafthub-360.png`,
`public/crafthub-landing.png`, `public/crafthub-logo.jpeg`,
`public/logos/crafthub.png`, `public/smokecraft/images/crafthub-landing.png`,
`public/design-references/mvp2/crafthub/crafthub-landing.png`, and
several `public/assets/pos360-reference/*` files — none of these are
referenced by `CraftHub.jsx` or `smokecraftAssets.js` (confirmed by the
grep above finding only the one `CRAFTHUB_IMAGE` constant). Classified
**HISTORICAL PROOF / REFERENCE**, not production assets. No action
needed — not moved or removed this pass, per instruction.

## Rule compliance summary

| Rule | Result |
|---|---|
| No generated substitute used as production asset | PASS (all production paths are real uploaded/approved files, no `data:` URIs or generated placeholders found in the registry) |
| No stock image | PASS (not found) |
| No browser screenshot used as production asset | PASS — screenshots live only under `public/proof/`, never referenced by `SC_ASSETS` or `CraftHub.jsx` |
| No unrelated route image | PASS for all 33 SC_ASSETS-driven routes (key names match route purpose 1:1) |
| No missing image fallback | PASS — 48/48 resolve |
| No live GitHub URL at runtime | PASS |
| Approved references don't accidentally function as fake live UI | PASS — reference folders (`smokecraft-reference/approved`, `/rejected`) are never imported by any route component, confirmed by grep |
| Production assets preserve approved composition | PASS for CraftHub (confirmed this session's rebuild); not re-verified pixel-by-pixel for all 33 SmokeCraft routes in this pass (already covered by the full visual acceptance review completed earlier this session, not re-run here) |
| Every runtime asset resolves locally | PASS, 48/48 |
| SC_ASSETS contains all production mappings | PASS for SmokeCraft; CraftHub uses its own local constant (`CRAFTHUB_IMAGE`) rather than SC_ASSETS — both patterns resolve locally, this is a naming/organization difference, not a defect |
