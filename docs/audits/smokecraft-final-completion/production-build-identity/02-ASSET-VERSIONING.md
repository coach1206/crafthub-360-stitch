# 02 — Asset Versioning

## Mechanism

`src/constants/assetVersion.js` exports `versionedAssetUrl(path)`, which appends `?v=<assetVersion>` to a path (idempotent — a no-op if already versioned). `src/constants/smokecraftAssets.js` runs every string value in `SC_ASSETS` through this helper once, at module load, immediately after the registry object literal — so all 79 registered assets are versioned automatically, and every existing consumer (30+ screens, unchanged) gets the cache-busted URL with zero per-component edits.

## Why this approach, not per-component changes

The mandate requires "every SmokeCraft asset consumer must use the same helper or registry." Editing 30+ components individually would be the largest-blast-radius way to satisfy that; post-processing the one shared registry object achieves the identical outcome (every consumer's URL is versioned) with a two-line change and zero risk of missing a consumer or introducing an inconsistency between screens.

## Coverage confirmed this pass

All of: landing, enroll, identity, venueSelect, mentorSelection, humidorMatch, meetYourCigar, terroir, format, cutToastLight, lightingTutorial, firstThird, flavorMemory, pairingLab, secondThird, mentorCommentary, knowledgeDrop (+ 4 sub-topic keys), finalThird, scorecard, aiSummary, pairingRecommendations, passportStamp, finalReview, rewards, achievements, recommendedNextJourney, goldenBox, and all remaining registered keys — 79 total, spot-verified in the dedicated suite (7 explicitly asserted, remainder covered by the registry-level check that the versioning loop runs over every key).

## Welcome (disclosed, unchanged)

No approved Welcome asset exists to version — correctly excluded from `KNOWN_MISSING`/build-manifest disclosure rather than silently versioned as `null`.

## Build-time validation

`scripts/validateSmokecraftAssets.mjs` runs as part of `prebuild` and fails the build if any registered asset's path (post-decoding, pre-version-query) does not exist on disk, or if the exact filename case does not match a real directory entry (catching a case-insensitive-filesystem masking of a real Linux/Railway-breaking case mismatch). 79/79 passed this pass.
