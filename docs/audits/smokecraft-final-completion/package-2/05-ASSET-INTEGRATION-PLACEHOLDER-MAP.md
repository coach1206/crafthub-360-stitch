# Asset Integration / Placeholder Map — Package 2

Per the permanent image directive: the user is actively creating new
SmokeCraft 360 images and will upload the approved images into GitHub
later. None were generated, replaced, or falsely marked final this
package. `MediaSlot.jsx` (see `03-COMPONENT-INVENTORY.md`) is the single
mechanism every Golden Box screen uses for imagery — ready to receive
approved assets without a screen rebuild, via either an `SC_ASSETS` key
lookup or a `directSrc` real-path override (added this closure pass —
see the mentor-portrait fix below).

## Addendum — mentor portrait resolved this closure pass (no longer a gap)

`MentorGuidancePanel.jsx` now renders each mentor's real, already-approved
portrait from the existing roster (`src/modules/smokecraft/smokeCraftMentors.js`,
`image` field, e.g. `/mentors/don-alejandro.jpg`) via `MediaSlot`'s new
`directSrc` prop — **not** a placeholder, and not a new image. This was a
real bug (see `06-TEST-EVIDENCE.md` addendum): `journey.mentor` is an
**array** of full mentor records (set by `Mentor.jsx:94`), not a single
`{ imageAssetKey }` object as originally assumed — fixed by reading
`mentorList[0]` and using the roster's own `image` path directly, with the
fix documented as a temporary compatibility mapping (no `SC_ASSETS` key
exists for mentor portraits; none was invented — the existing approved
`/mentors/*.jpg` path is used as-is). Live-verified: real image path
renders, real alt text present, honest unassigned state when no mentor
is selected (no fixed fallback identity, no random placeholder person).

## Remaining slots — still `USER_CREATING_IMAGE`

| Slot | Existing approved image? | Status | Future GitHub asset path (expected) | Future `SC_ASSETS` key (proposed) | Session | Route | Component | Educational-content connection | Upload/replace behavior | Responsive | Accessibility |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Golden Box Hub hero | No | `USER_CREATING_IMAGE` | `public/assets/smokecraft/golden-box-hub-hero.png` | `goldenBoxHubHero` | Golden Box (supporting module) | `/golden-box/competitions` | `GoldenBoxHub.jsx` | N/A (decorative hero) | Swap `SC_ASSETS` value when approved; `MediaSlot` `decorative` prop already wired | `object-fit: cover`, fills container | `aria-hidden`, empty alt (decorative) |
| Competition card thumbnail | No | `USER_CREATING_IMAGE` | `public/assets/smokecraft/golden-box-competition-<key>.png` (per-competition, future DB-backed `metadata.imageKey`) | `goldenBoxCompetitionThumb_<id>` | Golden Box | Hub cards | `GoldenBoxHub.jsx` | Could link to competition rules | Same pattern | Same | Alt = competition title |
| Blend component icons (wrapper/binder/filler/seed/soil/terroir/etc., 21 types) | No | `USER_CREATING_IMAGE` | `public/assets/smokecraft/golden-box-component-<type>.png` | `goldenBoxComponent_<type>` | Golden Box (feeds Package 3's education content) | Entry Workspace educational panel | `EducationalDetailPanel.jsx` via `MediaSlot` | Directly — panel shows full educational text alongside the image slot | Per-component, keyed by `component_type`; `MediaSlot`'s `assetKey` prop already wired in `EducationalDetailPanel.jsx` | 100%×160px in panel | Alt = component title |
| Results/badge imagery | Reuses existing `passport_360_badges`/Rewards screen imagery (not duplicated) | Not applicable — out of Golden Box's own scope | N/A | N/A | N/A | Results Experience | Links out to `/smokecraft/rewards` | Existing Rewards screen's own content | Existing | Existing | Existing |

When the user uploads these images to GitHub, the expected workflow is:
place the file at the path above, add/update the corresponding
`SC_ASSETS` key in `src/constants/smokecraftAssets.js` (same mechanism
already governing every other SmokeCraft screen's imagery), and no
component code changes — `MediaSlot` will pick it up automatically. No
placeholder in this codebase is marked final; every fallback explicitly
renders "Image pending" text, never a baked stand-in image.

No baked user data, no baked selection, no baked status, and no
permanent highlight exists in any `MediaSlot` usage — confirmed by code
review of `MediaSlot.jsx` (renders only `assetKey`/`directSrc`/`alt`/
`caption` props, no journey/user data embedded in the image itself).
