# 01 — Asset Map

| Screen | Approved asset path | SHA-256 | Blank-zone template? |
|---|---|---|---|
| Leaderboard | `public/assets/smokecraft/LEADERBOARD 111.png` | `7120ab3ba5fd9a0b0c6a1f16946d1b8a4a90a398994f7422495cb47291ee13d0` | Yes — converted |
| Identity | `public/assets/smokecraft/IDENTY.png` | `006685040277d1cf4f1d00e9ed68d6d0d740e41900c12be0386298968dc0b5d4` | Yes — converted |
| Pairing Recommendations | `public/assets/smokecraft/personlized pairing 222.png` | `f060831b151cbefc6d265b962793498eea116faa8ec80cdae81788279201e075` | Yes — converted |
| Pairing | `/assets/smokecraft-reference/approved/smokecraft-pairing.png` | (referenced directly, not via SC_ASSETS) | Yes — converted (crop fixed) |
| Rewards (S25) | `public/assets/smokecraft/REWARDS 222.png` | `986196149e83c89562bf317763c5ba8eb7332546090189f441fec9fd01a99895` | **No** — fully-baked mock dashboard, no blank zones. Blocked. |
| Achievements (S26, sibling of Rewards) | `public/assets/smokecraft/ACHIEVMENTS.png` | `32e64aadd40d56102de3a4fb8667fe4c030d84c0377ff2f4b8b48a2d6191d24f` | Yes — genuine blank-value template (`--`, `-- / --`, `+-- XP` throughout). Not used this pass since Rewards.jsx hosts both S25/S26 behind one mode toggle and the S25 image blocks full conversion of the shared component. |
| Resume Journey | none exists | n/a | No approved asset exists at all. Blocked. |
