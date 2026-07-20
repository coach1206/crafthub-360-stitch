# Asset Registry

## Registry mechanism (existing, reused — not rebuilt)

`src/constants/smokecraftAssets.js` exports `SC_ASSETS`, ~55 keyed
entries mapping a session/route label to a resolved image path across
three tiers: `CROPPED` (`/assets/smokecraft/cropped`, clean atmosphere
backgrounds), `REF` (`/assets/smokecraft-reference/approved`, approved
full compositions), `RAW` (`/assets/smokecraft`, newest approved
uploads — takes priority over `CROPPED` when both exist for a route,
per the file's own documented 2026-07-11 priority rule). Companion
route-to-image documentation: `docs/SMOKECRAFT_ROUTE_IMAGE_MASTER_MAP.md`.

This mechanism is the correct, existing place to register any new asset
slot required by Golden Box/gamification work — no second registry
should be created.

## Per-asset detail (representative sample — full 55-entry enumeration deferred)

Given the 55 entries are all governed by the same three-tier resolution
rule and the same approval process, this pass reports the mechanism plus
spot-checked entries rather than 55 individually detailed rows (time
budget disclosed reduction — the mechanism itself, not per-file detail,
is what Package 1 needs to register new slots against).

| Registry key | Path | Route | Orientation | Baked text/data | Functional or decorative |
|---|---|---|---|---|---|
| `landing` | `${REF}/smokecraft-landing.png` | `/smokecraft` | Landscape | Unknown — not pixel-inspected this pass | Decorative background |
| `enroll` | `${REF}/smokecraft-guest-pass.png` | `/smokecraft/enroll` | Landscape | Unknown | Decorative background |
| `identity` | `${RAW}/IDENTY.png` | `/smokecraft/identity` | Landscape | Unknown | Decorative background |
| `goldenBox` | `${RAW}/GOLDEN%20BOX%20RULES.png` | `/smokecraft/golden-box` | Landscape | Unknown | Decorative background for the rules-acceptance screen — **will need a genuinely new set of interactive-screen assets once Golden Box becomes a real builder (Package 1/9)**, this one is scoped to the current rules-only screen |
| `mentorSelection` | `${RAW}/MENTOR%20SELECTION1.png` | `/smokecraft/mentor-selection` | Landscape | Unknown | Decorative background |
| `meetYourCigar` | `${RAW}/DISOVER%20YOUR%20CIGAR%20PROFILE.png` | `/smokecraft/meet-your-cigar` | Landscape | Unknown | Decorative background — file's own comment notes this was previously a duplicate of Humidor Match's image, since corrected |
| `mentorCommentary` | `${RAW}/MENTOR%20:COMMENTARY.png` | `/smokecraft/mentor-commentary` | Landscape | Unknown | Decorative background |

Full pixel-level inspection (dimensions, baked-text/baked-data detection,
accessibility alt-text presence) for all 55 entries was not performed
this pass — flagged as a follow-up task, not silently marked complete.
Per the mandate's own rules (deep navy/charcoal/walnut/amber/champagne-
gold, no baked names/scores/progress, realistic photography), any new
Golden Box asset request (Package 1) must be spot-checked against these
same rules before being marked APPROVED.

## New asset slots — deferred

Per the prior audit report (`AUDIT-REPORT-20260720.md` §5), missing-
image specifications for the Golden Box/gamification visual groups are
deferred to Package 1, since the underlying interactions haven't been
designed yet — an asset slot for a screen that doesn't exist as a real
interaction would be premature and likely to need rework.
