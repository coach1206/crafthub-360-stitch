# Image Future-Integration Map — Package 3

No images were generated, replaced, or falsely marked final this
package, consistent with the permanent directive. `smokecraft_content_media`
and `smokecraft_hotspots` (migration 079) are the new database-backed
readiness mechanism — every future image slot has a real row with
`current_status = 'USER_CREATING_IMAGE'` by default, `future_github_path`,
`sc_assets_key`, `alt_text`, `caption`, `orientation`, and
`responsive_crop_guidance` columns ready to populate.

No `smokecraft_content_media` rows were seeded this package (the 34
component records were seeded with `media_asset_key = NULL`, honestly
reflecting "no image yet") — Package 2's
`05-ASSET-INTEGRATION-PLACEHOLDER-MAP.md` remains the authoritative
list of exactly which images are still required (hub hero, competition
thumbnails, 21 blend-component icons). Package 3 additionally surfaces:

| New requirement (Package 3) | Expected GitHub path | `SC_ASSETS` key | Status |
|---|---|---|---|
| 7 plant anatomy images + hotspots | `public/assets/smokecraft/anatomy-<part>.png` | `smokecraftAnatomy_<part>` | `USER_CREATING_IMAGE` |
| 4 leaf priming images | `public/assets/smokecraft/priming-<key>.png` | `goldenBoxComponent_leaf_priming_<key>` | `USER_CREATING_IMAGE` |
| 3 vitola shape images | `public/assets/smokecraft/vitola-<key>.png` | `goldenBoxComponent_vitola_<key>` | `USER_CREATING_IMAGE` |
| 16 flavor-group icons | `public/assets/smokecraft/flavor-<group>.png` | `flavorNote_<group>` | `USER_CREATING_IMAGE` |

When the user uploads to GitHub: insert a `smokecraft_content_media` row
(or update `golden_box_component_catalog.media_asset_key`/
`future_github_asset_path`), add the `SC_ASSETS` key, and `MediaSlot`
(Package 2) picks it up automatically — no component code change
required. `current_status` transitions `USER_CREATING_IMAGE → UPLOADED →
INTEGRATED`, never skipped or marked complete prematurely.
