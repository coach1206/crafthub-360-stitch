# SmokeCraft 360 — Image Surface Audit

Two layers of verification, per the mandate's own distinction ("do not count asset existence as successful rendering"):

## Layer 1 — asset existence (mechanical, exhaustive)

`scripts/generateSmokecraftFullGameInventory.mjs` cross-checks every session's declared `SC_ASSETS` key against the real file on disk. Result: **0 missing assets across all 27 sessions** (see `docs/SMOKECRAFT_FULL_GAME_INVENTORY.md` §Asset render status). `scripts/validateSmokecraftAssets.mjs` (pre-existing, build-blocking) independently confirms 85/85 registered assets exist on disk with correct case.

## Layer 2 — real browser render verification (the layer that actually catches defects)

Real Playwright captures, against the production build, confirm actual pixels rendered in a real browser (not asset-existence inference):

| Screen | Verified via | Result |
|---|---|---|
| Enroll, Identity, Venue Select, Welcome | `public/proof/smokecraft-canonical-opening-sequence-recovery/01-04-*.png` | Rendered correctly, real photography visible |
| Golden Box Rules | same folder, `05-golden-box-rules.png` + 4-viewport captures | Rendered correctly (desktop/laptop/kiosk); **tablet-portrait letterboxed**, see `CURRENT_VISUAL_DEFECTS.md` |
| Mentor Selection | `06-mentor-selection.png` | Rendered correctly — 8 real mentor portraits visible |
| Seed & Soil | `07-seed-soil.png` | Rendered correctly |
| Humidor Match (initial/selected/applied) | `08-10-humidor-match-*.png` + 4-viewport captures | Rendered correctly — real hero photo, real cards, real "ACTIVE" badge appearing only on real selection (this is the exact case that previously failed silently — SC-D076 — now confirmed rendering correctly) |
| Meet Your Cigar | `11-meet-your-cigar.png` | Rendered correctly |
| All screens covered by the viewport touch-proof harness | `scripts/captureSmokecraftViewportTouchProof.mjs` output, `public/proof/smokecraft-viewport-touch-proof/` | 55/55 — zero console errors, zero HTTP failures, zero broken-image indicators across desktop/laptop/tablet-landscape/tablet-portrait/kiosk |

## What this layer catches that Layer 1 cannot

Layer 1 (existence) would have reported `HumidorMatch.jsx`'s baked mockup PNG as "asset exists, all good" right up until the moment it was replaced — the file was present and valid, the defect was entirely in *how* it was used (baked fake state, not missing/broken imagery). Layer 2 is what actually proved the fix: a real click producing a real "ACTIVE" badge that was absent before selection, captured as a real screenshot, not inferred.

## R2 vs. repo fallback status

No live `STORAGE_PROVIDER=r2` credentials are configured in this sandbox — every image in the captures above resolved via tier 2 (approved GitHub-built fallback), which is the documented, expected, safe behavior when R2 isn't activated (`resolveSmokeCraftAsset()` — see `docs/smokecraft-ui-handoff/IMAGE_AND_MEDIA_SPEC.md`). No external URLs were used anywhere (`scripts/verifySmokecraftNoExternalImageUrls.mjs`, build-blocking, passing).
