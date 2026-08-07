# Image and Media Spec

## Resolution order (structural, not a convention to remember)

`src/services/smokecraft/assetResolver.js` — `resolveSmokeCraftAsset(assetId)`:

1. **R2** — only when a build-time-embedded registry snapshot marks the asset synchronized to Cloudflare R2 and `VITE_SMOKECRAFT_R2_PUBLIC_BASE_URL` is configured.
2. **Approved GitHub-built fallback** — `SC_ASSETS` (SmokeCraft screens) or `craftImages` (cross-module fallbacks/portraits), both real and bundled.
3. **Safe branded failure** — never substitutes a different image, never guesses, never fetches an external URL.

The resolver **only accepts a known asset ID** — never a raw URL — so "no external image URLs" is structural, not a runtime check that can be bypassed. `scripts/verifySmokecraftNoExternalImageUrls.mjs` is build-blocking.

## Every asset key

`ASSET_MAP.json` in this folder — generated directly from `src/constants/smokecraftAssets.js` (86 keys at last generation). Do not hand-add new keys without also registering them in the asset governance/registry pipeline (`scripts/smokecraftAssetRegistry.mjs`).

## Rules for a UI developer adding new imagery

- Use `resolveSmokeCraftAsset('existingKey')` for anything already in `ASSET_MAP.json`.
- To add a genuinely new supporting image, add a new `SC_ASSETS` key (see the `humidorMatchHero` precedent added this pass — decorative header banner, real approved supporting photo, never a surface controls sit on) — do not hardcode a path string inline in a component.
- Never render an approved-looking mockup PNG as the entire interactive surface of a screen — that was the SC-D076 root cause. A background/decorative image is fine; a background image with baked buttons/state/progress text pretending to be the UI is not.
- Verify actual browser rendering, not just file existence — `docs/SMOKECRAFT_IMAGE_SURFACE_AUDIT.md` documents the real-render verification method used this pass.
