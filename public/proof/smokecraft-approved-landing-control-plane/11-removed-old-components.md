# Old / non-approved production reachability removed this pass

| Item | Kind | Action |
|---|---|---|
| `HowItWorks.jsx` (prior implementation) | Claude-composed CSS/React screen, **no image at all** (`radial-gradient` shell + glass cards) | **Replaced** by approved-image shell (`HOW IT WORKS.png`) |
| `RewardsCenter.jsx` (prior implementation) | Approved image capped at `maxHeight:62vh` + hand-built glass-card stack below | **Replaced** by approved-image shell at true 1672x941 ratio |
| `SC_ASSETS.howItWorks` → `smokecraft-how-it-works.png` | Internal design **storyboard** wired into a production asset key | **Key removed.** Had no remaining consumer; cannot be routed again. File kept on disk as internal reference. |
| `/smokecraft/passport` → `<Navigate to="/passport">` | Route alias to an unrelated module | **Replaced** by the real approved Passport screen |
| Landing PASSPORT → `/smokecraft/passport-stamp` | Hardcoded route into a `sessionNumber={23}`-guarded curriculum screen (bounced guests to `/enroll`) | **Removed**; resolves via the canonical resolver to the approved Passport destination |
| Landing CRAFTHUB → `/smokecraft/smokecraft-challenge` | Hardcoded route into a `requires="scorecard"`-guarded screen; tile label/destination mismatch | **Removed**; resolves to the new approved CraftHub destination |
| Landing PAIRING → `/smokecraft/pairing-lab` | Hardcoded route into a `sessionNumber={11}`-guarded screen | **Removed**; resolves to the unguarded approved pairing screen |
| 7 inline `navigate()`/`go()` route strings in `SmokeCraft.jsx` | Scattered destination map | **Removed**; all controls call `resolveSmokeCraftLandingAction` |
| Duplicate CTA-label logic in `SmokeCraft.jsx` | Second implementation of the three-state decision | **Removed**; label and route now come from the same resolver call |

## Verified correct and deliberately NOT touched
`HumidorMatch.jsx` — already renders `SC_ASSETS.humidorMatch` via `SmokeCraftImageBoundsOverlay`, one live control layer, no static lock image. Confirmed against the working baseline; left alone.

## NOT removed — disclosed as remaining
`Leaderboard.jsx` (approved image still only a ~14vh decorative band), `Rewards.jsx` (S25), `PairingRecommendations.jsx` (S22), `Identity.jsx`, `ResumeJourney.jsx` — same violation class, outside this pass's landing-destination scope. See `00-FINAL-REPORT.md` §7.
