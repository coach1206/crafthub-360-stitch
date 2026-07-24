# 01 — Entry Flow

Verified live against a clean browser context (`localStorage.clear()` before navigating).

| Step | Route | Result |
|---|---|---|
| Landing | `/smokecraft` | Renders; no stale prior-journey names (`Greg Guy`/`Romeo y Julieta 1875`/`Carlos Mendoza`) present |
| Enrollment | `/smokecraft/enroll` | Reachable with zero prior progress |
| Identity | `/smokecraft/identity` | Reachable once `enroll` complete; starts blank (no preselected experience level/interests — re-confirmed correct per the Prompt 1 `journey.identity` root-cause fix, not re-audited from scratch this pass) |
| Venue | `/smokecraft/venue-select` | Reachable once `enroll` complete |
| Welcome | `/smokecraft/welcome` | Reachable once `enroll` complete; shows only current-journey data (learner name from the seeded identity, not any prior journey) |

Screenshots: `public/proof/smokecraft-complete-game-playthrough/screenshots/entry-01-landing.png`, `entry-enroll.png`, `entry-identity.png`, `entry-venue.png`, `entry-welcome.png`.
