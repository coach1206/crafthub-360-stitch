# API Contract — Package 3

Mounted at `/api/smokecraft/golden-box-content`
(`server/routes/goldenBoxContentRoutes.js`).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/components` | Public | List published components, filterable by `category`/`selectableOnly` |
| GET | `/components/:id` | Public | Full detail + compatibility + quiz (published only) |
| GET | `/flavor-notes` | Public | List flavor taxonomy, filterable by `group` |
| POST | `/components` | admin | Create draft content |
| PATCH | `/components/:id` | admin | Update draft (rejects if already published — `cannot_edit_published_directly_use_new_version`) |
| POST | `/components/:id/publish` | admin | Publish |
| POST | `/components/:id/archive` | admin | Archive |

Quiz reads (`listQuizForComponent`) always exclude `correct_answer`/
`explanation` — live-verified (Package 3 test: "quiz reads exclude
correct_answer/explanation, no answer leakage").

All errors use the same `{success:false, error:<code>}` shape as every
prior package's API. Rate limiting: 90/min reads, 30/min writes — same
`express-rate-limit` tiers reused throughout this session.
