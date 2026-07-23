# 02 — SmokeCraft Entry Route-to-Asset Map (Authoritative)

| Route | Component | Asset key (`smokecraftAssets.js`) | Asset path |
|---|---|---|---|
| `/smokecraft` | `SmokeCraft.jsx` | `landing` | `public/assets/smokecraft-reference/approved/smokecraft-landing.png` |
| `/smokecraft/enroll` | `Enroll.jsx` | `enroll` | `public/assets/smokecraft-reference/approved/smokecraft-guest-pass.png` |
| `/smokecraft/identity` | `Identity.jsx` | `identity` | `public/assets/smokecraft/IDENTY.png` |
| `/smokecraft/venue-select` | `VenueSelect.jsx` | `venueSelect` | `public/assets/smokecraft/Venue Selection 11.png` (hero band only — see disclosure) |
| `mentor-selection` | `Mentor.jsx` | `mentorSelection` (composite) + `public/mentors/*.jpg` (decomposed crops) | `public/assets/smokecraft/MENTOR SELECTION1.png` |
| `/smokecraft/welcome` | `WelcomeExperience.jsx` | — | **none exists** (disclosed gap, not fabricated) |
| `humidor-match` (Session 1) | `HumidorMatch.jsx` | `humidorMatch` | `public/assets/smokecraft/Humidor Match 1.png` |

Verified via `App.jsx`: exactly one `<Route>` registration exists for each of `welcome`, `enroll`, `venue-select`, `mentor-selection`, `identity`, and `humidor-match` — no duplicate routes, no deprecated aliases silently overriding the current route (checked with `grep -c` per path in this pass's dedicated suite).
