# Component Inventory — Package 2

| File | Type | Responsibility |
|---|---|---|
| `src/pages/smokecraft/goldenBox/GoldenBoxHub.jsx` | Page | Competition discovery, grouped by real status (open/upcoming/in-judging/completed), honest empty state |
| `src/pages/smokecraft/goldenBox/CompetitionDetail.jsx` | Page | Full competition detail, real eligibility evaluation + per-rule display, entry creation trigger |
| `src/pages/smokecraft/goldenBox/EntryWorkspace.jsx` | Page | Blend builder (required/optional component pickers), draft review, submission confirmation, locked/status state |
| `src/pages/smokecraft/goldenBox/ResultsExperience.jsx` | Page | Results state, XP balance, links to existing Leaderboard/Rewards |
| `src/components/smokecraft/goldenBox/EducationalDetailPanel.jsx` | Reusable component | One modal for every educational interaction; focus-trapped, Escape-to-close, ARIA dialog |
| `src/components/smokecraft/goldenBox/MentorGuidancePanel.jsx` | Reusable component | Dynamic mentor display from `journey.mentor`, neutral unassigned state |
| `src/components/smokecraft/goldenBox/MediaSlot.jsx` | Reusable component | Image-ready media shell — approved `SC_ASSETS` lookup with honest "image pending" fallback, never a baked placeholder |
| `src/components/smokecraft/goldenBox/educationalContentContract.js` | Data contract (not a component) | Shared shape for all educational content; `fromCatalogRow()` and `notYetConfigured()` constructors |
| `src/hooks/useGoldenBox.js` | Hooks | `useGoldenBoxCompetitions`, `useGoldenBoxCompetitionDetail`, `useGoldenBoxEntry`, `ensureIdentity` |
| `src/services/goldenBox/goldenBoxApiClient.js` | API client | 11 functions covering all Package 1 endpoints used by the frontend this package |

10 new frontend files total (4 pages + 3 components + 1 data contract + 1 hook file + 1 API client), plus 2 small backend fixes (AI-route hardening in the existing controller, cookie-path fix in the existing guest-identity middleware) and 1 new migration (078).
