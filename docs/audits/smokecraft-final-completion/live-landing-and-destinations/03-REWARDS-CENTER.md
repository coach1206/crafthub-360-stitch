# 03 — Rewards Center

**Defect:** landing REWARDS card → `/smokecraft/humidor-match` (session-2). For any real user the session-2 entry guard redirected to `/smokecraft/enroll`; the approved Reward Center visual was never reachable.

**Fix:**
- New landing-accessible route `/smokecraft/rewards-center` (unguarded).
- New `RewardsCenter.jsx` renders approved `Reward Center.png` as the visual shell (`data-visual-source="reward-center"`), verified: rendered background-image URL = `/assets/smokecraft/rewards/Reward%20Center.png`, sha256 `489ad9ca433454358545e762d1f7718295cfed4fc0c4230791d096fd114ffc30` == disk.
- Real data only: Total XP + rank (`getRankFromXP`), and real loyalty-point fields already on the guest session (`redeemablePoints` / `lifetimeLoyaltyPoints` / derived redeemed). No fabricated balances.
- **Honest disclosure:** there is no real venue-specific rewards backend in this build. Venue rewards render as an explicit empty state ("Venue-specific rewards are not yet available… only real rewards will ever be listed"). No fake offers/codes/categories were invented.
