# SC-D062 Closure Proof — Stage 5 Closure Gate

## Before

`server/controllers/goldenBoxController.js` exported
`handleIssueRewards(req, res)`, wired at
`POST /api/smokecraft/golden-box/entries/:entryId/rewards`
(`requireAuth + requireRole('admin')`), which read
`req.body.xpAmount` and `req.body.badgeId` directly and passed them,
unvalidated against any rule, straight to `rewardsIntegrationService.grantXp()`/
`grantBadge()`. An authorized admin could grant an arbitrary XP amount
or badge to any entry with zero connection to real placement or any
approved rule. Confirmed zero live callers (no frontend screen or
other service ever invoked this route).

## Action taken

Removed entirely:
- `handleIssueRewards()` deleted from `goldenBoxController.js`.
- The unused `rewardsIntegrationService` import deleted alongside it.
- The route registration deleted from `goldenBoxRoutes.js`, replaced
  with an explanatory comment pointing to the real award path.

## Live verification

```
$ curl -s -w "\nSTATUS:%{http_code}\n" -X POST \
  http://localhost:3001/api/smokecraft/golden-box/entries/00000000-0000-0000-0000-000000000000/rewards \
  -H "Content-Type: application/json" -d '{"xpAmount":9999,"badgeId":"fake"}'
{"success":false,"message":"Route not found"}
STATUS:404
```

Also verified via `verify-smokecraft-stage5-closure-integration.mjs`
section 0 (live, automated): the route returns 404, never processes
the client-controlled payload.

## Regression protection

`scripts/validateSmokecraftGoldenBoxAwardsAuthority.mjs` section 10
(4 checks, all passing) fails the build if:
- the route reappears in `goldenBoxRoutes.js`
- `handleIssueRewards` reappears in `goldenBoxController.js`
- any route reads `req.body.xpAmount`/`req.body.badgeId`
- `rewardsIntegrationService` is imported anywhere outside
  `awardsService.js`

## Result

SC-D062 is permanently closed — removed, not merely documented.
