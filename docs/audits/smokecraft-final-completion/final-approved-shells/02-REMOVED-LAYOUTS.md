# 02 — Removed Layouts

- **Leaderboard.jsx**: removed the ~14vh decorative-header-band image usage plus the generic hand-built participant list rendered below it. The approved image is now the entire visual shell via `SmokeCraftImageBoundsOverlay`, with real overlays for rank/points/badges/filters positioned over the image's own zones.
- **Identity.jsx**: removed the generic dashboard-card layout; the approved `IDENTY.png` is now the full shell with form fields overlaid on its intended zones.
- **PairingRecommendations.jsx**: removed the generic card-stack layout; the approved image is now the full shell, with the existing real choose/reject-alternate logic preserved and re-wired to overlay positions on the image.
- **Pairing.jsx**: removed the `background-size: cover` cropping approach in favor of `SmokeCraftImageBoundsOverlay`'s intrinsic, non-destructive sizing.

No old layout was left behind as dead code in any of the 4 converted files — each was fully replaced, not left commented out or reachable behind a condition.

Rewards.jsx and ResumeJourney.jsx were **not modified** — their existing decorative-band/photo-header usage remains, since no correct full-shell conversion is possible given the current state of their approved assets (see `00-FINAL-REPORT.md`).
