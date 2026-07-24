# 02 — Landing Control Map (post-fix)

| Visible control | Accessible name | Route | Guard | Notes |
|---|---|---|---|---|
| Primary CTA | START / RESUME / VIEW COMPLETED | `getEntryRoute()` → `/smokecraft/enroll` \| `/venue-select` \| `/resume` | entry | dynamic label via `computeJourneyStatus` |
| Secondary CTA (returning) | Start New Journey | confirm → `useStartNewSmokeCraftJourney({firstRoute:'/smokecraft/enroll'})` | — | archives current, one clean journey |
| How It Works | How It Works | `/smokecraft/how-it-works` | none | |
| Card link | View Passport | `/smokecraft/passport-stamp` | session-23 | |
| Card link | View Pairing | `/smokecraft/pairing-lab` | session-11 | |
| Bottom: REWARDS | Rewards | **`/smokecraft/rewards-center`** (was `/humidor-match`) | none | approved Reward Center.png |
| Bottom: RANKINGS | Rankings | `/smokecraft/leaderboard` | none | approved LEADERBOARD 111.png |
| Bottom: PASSPORT | View Passport (bottom bar) | `/smokecraft/passport-stamp` | session-23 | live lock panel if not unlocked |
| Bottom: CRAFTHUB | Enter Challenge | `/smokecraft/smokecraft-challenge` | requires scorecard | journey preserved |

All controls preserve the active journey (no reset, no new journey created); every activation fires exactly one navigation.
