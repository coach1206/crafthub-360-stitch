# 01 — Approved Asset Map

Approved-Asset Control Plane pass. Every row was verified by opening the actual file
on disk at the exact path and case shown — no row is accepted on the strength of an
`SC_ASSETS` label alone. `sha256` is the full hash of the bytes in the repository;
the paired suite re-hashes what the browser actually received and asserts equality.

| Screen | Approved file (repo path) | Dimensions | sha256 | Route | Component | Asset key |
|---|---|---|---|---|---|---|
| Landing | `public/assets/smokecraft-reference/approved/smokecraft-landing.png` | 1189x667 | `f817ab40ad138135513ad70b395725c9…` | `/smokecraft` | `src/pages/SmokeCraft.jsx` | `SC_ASSETS.landing` |
| How It Works | `public/assets/smokecraft/session-visuals/HOW IT WORKS.png` | 1448x1086 | `5c473e68e23210e45357e15d7d208979…` | `/smokecraft/how-it-works` | `src/pages/smokecraft/HowItWorks.jsx` | `SC_ASSETS.howItWorksUser` |
| Rewards Center | `public/assets/smokecraft/rewards/Reward Center.png` | 1672x941 | `489ad9ca433454358545e762d1f77182…` | `/smokecraft/rewards-center` | `src/pages/smokecraft/RewardsCenter.jsx` | `SC_ASSETS.rewardCenter` |
| Passport | `public/assets/smokecraft/360 PASSPORT  2.png` | 1672x941 | `82d0a8b82bf5978fab0235e17ce0f5fc…` | `/smokecraft/passport` | `src/pages/smokecraft/SmokeCraftPassport.jsx` | `SC_ASSETS.passportHub` |
| CraftHub | `public/assets/smokecraft/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | 1672x941 | `5d54123996272daf1aceab35bdb39ae9…` | `/smokecraft/crafthub` | `src/pages/smokecraft/SmokeCraftCraftHub.jsx` | `SC_ASSETS.craftHubVenueTable` |
| Rankings / Leaderboard | `public/assets/smokecraft/LEADERBOARD 111.png` | 1538x1022 | `7120ab3ba5fd9a0b0c6a1f16946d1b8a…` | `/smokecraft/leaderboard` | `src/pages/smokecraft/Leaderboard.jsx` | `SC_ASSETS.leaderboard` |
| Pairing | `public/assets/smokecraft-reference/approved/smokecraft-pairing.png` | 1086x1448 | `4c37a5dadba900df171caf5e859ca716…` | `/smokecraft/pairing` | `src/pages/smokecraft/Pairing.jsx` | `(hardcoded path)` |
| Humidor Match | `public/assets/smokecraft/Humidor Match 1.png` | 1672x941 | `63c6510b549a89cafb7e2b293afce68d…` | `/smokecraft/humidor-match` | `src/pages/smokecraft/HumidorMatch.jsx` | `SC_ASSETS.humidorMatch` |

## Verified-absent / rejected assets

| File | Why it is NOT used |
|---|---|
| `public/assets/smokecraft-reference/approved/smokecraft-how-it-works.png` | Internal design **storyboard** ("SMOKECRAFT 360 \| STORYBOARD S1 -> S4", covered in S1.1/S2.1/"S1 GOAL" planning labels). Not a user-facing screen. Its `SC_ASSETS.howItWorks` key had no remaining consumer and is **removed** this pass so it cannot be routed again. File retained on disk as internal reference. |
| `Welcome` / session-1 | No approved asset exists. Unchanged this pass — still served by its pre-existing live component via `SmokeCraftScreenRenderer screenId="session-1"`. Honestly disclosed, not replaced with a Claude-built screen. |

## Encoding note

Several approved filenames contain spaces, and `360 PASSPORT  2.png` contains **two**
consecutive spaces. `smokecraftAssets.js` percent-encodes these (`%20%20`). The suite
decodes before hashing, so an encoding mistake surfaces as a missing-file failure
rather than a silently broken image.
