# 03 — Destination Routes

All verified by real Playwright visible-control clicks (see
`verify-smokecraft-railway-proxy-and-destinations.mjs`) plus source/asset checks.

## Rewards
- Landing "Rewards" control → `/smokecraft/rewards-center` (`src/pages/SmokeCraft.jsx`).
- Route wired in `src/App.jsx`; component `src/pages/smokecraft/RewardsCenter.jsx`.
- Approved visual: `public/assets/smokecraft/rewards/Reward Center.png`
  (`SC_ASSETS.rewardCenter`). Rendered background-image hash == disk sha256
  (asserted live, check 7).
- Data shown is real/honest only:
  - Standing: real XP + rank from the guest session.
  - Reward Points tiles: **Available**, **Journey**, **Redeemed**, **Lifetime**
    — all from real session fields (`redeemablePoints`, `loyaltyPoints`,
    `lifetimeLoyaltyPoints`); no fabricated numbers.
  - Venue Rewards: honest empty-state rows for **Drink specials**, **Cigar &
    smoke specials**, **Food specials**, **Pairing specials**, **Venue perks**,
    each labelled "None configured". No sample offers. (These itemized categories
    were added this pass; the prior pass had a single blanket empty-state
    paragraph.)
- No real venue-rewards backend exists, so the empty state is by design.

## Rankings
- Landing "Rankings" control → `/smokecraft/leaderboard`.
- Renders the approved `<Leaderboard/>` using `LEADERBOARD 111.png`
  (`SC_ASSETS.leaderboard`).
- No stale/baked data: "James Carter", "18,750"/"18750", and "4435" are all
  absent from the rendered HTML (checks 8/11).
- Every leaderboard route in `App.jsx` (`/smokecraft/leaderboard` at two nesting
  levels, the `passport/leaderboard` and `ceremony` Navigate aliases, and
  `grand-lounge-ranking`) renders the **same** approved `<Leaderboard/>`
  component. There is no old generic leaderboard component or route to remove —
  re-verified, consistent with the prior pass.

## Passport
- Landing "View Passport" control → `/smokecraft/passport-stamp` (session-23
  renderer, `SmokeCraftScreenRenderer screenId="session-23"`).
- Fresh users (no contiguous progress) are correctly gated by the live
  `SmokeCraftSessionGuard` to `/smokecraft/enroll` — a **live redirect**, not a
  baked lock image (check 9a). This is the documented-correct product gating.
- For an eligible user (seeded contiguous prefix through session 23) the approved
  Passport screen renders without bouncing to enroll (check 9).
- No `FUTURE VISIT LOCKED` / `MANAGEMENT SYNC LOCKED` text and no old lock PNG
  element (`future-visit-locked`, `passport-stamp-locked`, `padlock`) renders
  (check 10). `LockedSmokeCraftScreen.jsx` (fixed by the prior pass) shows a live
  prerequisite panel; a repo-wide grep confirms the only remaining references to
  the old lock strings/filenames are in explanatory code comments and prior-pass
  proof artifacts, not in any active render path.

## Active-journey integrity
Navigating Start → rewards-center → leaderboard preserves the same
`activeJourneyId` (check 12). No destination loops back to Start.
