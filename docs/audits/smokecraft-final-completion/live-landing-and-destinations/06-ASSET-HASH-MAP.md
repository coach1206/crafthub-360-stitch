# 06 — Asset Hash Map (rendered vs disk)

| Screen | Rendered asset URL | Disk path | sha256 | Match |
|---|---|---|---|---|
| Rewards Center | `/assets/smokecraft/rewards/Reward%20Center.png` | `public/assets/smokecraft/rewards/Reward Center.png` | `489ad9ca433454358545e762d1f7718295cfed4fc0c4230791d096fd114ffc30` | ✅ rendered==disk (curl of served URL hashed identically) |
| Rankings | `/assets/smokecraft/LEADERBOARD%20111.png` | `public/assets/smokecraft/LEADERBOARD 111.png` | `7120ab3ba5fd9a0b0c6a1f16946d1b8a4a90a398994f7422495cb47291ee13d0` | ✅ (disk) |
| Landing | `/assets/smokecraft-reference/approved/smokecraft-landing.png` | approved ref | unchanged this pass | — |
| Passport locked | none (live panel, no image) | — | — | old lock PNGs removed |
