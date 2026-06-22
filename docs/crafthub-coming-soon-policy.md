# CraftHub "Coming Soon" Policy

## Current priority order

1. **Finish SmokeCraft** as the proven MVP2 reference vertical (substantially
   complete as of Phase 12 — see `docs/smokecraft-mvp2-closeout.md` for what
   remains).
2. **Complete the CraftHub shell** (the parent hub UI that lists/links to
   verticals).
3. **Complete POS3** as a standalone terminal product.
4. **Complete E.A.T.** as a standalone operations product.
5. Only after 1–4 are stable does any other CraftHub vertical
   (WineCraft, BeerCraft, PourCraft, CoffeeCraft, FoodCraft, etc.) begin
   real development.

This order is deliberate: SmokeCraft exists specifically to prove out the
session/scorecard/winner/POS3/E.A.T./shared-storage pattern once, correctly
and honestly, so every future vertical can replicate it
(`docs/crafthub-mvp2-replication-blueprint.md`) instead of re-inventing it.
Building a second vertical before SmokeCraft's pattern is fully proven
would duplicate unresolved problems (auth gating, Postgres deployment)
across multiple verticals at once.

## Coming Soon rules

Any CraftHub vertical tile that is not yet built must follow these rules —
no exceptions, no shortcuts:

- **No fake scorecards.** A Coming Soon vertical must not render a
  scorecard UI with placeholder or invented ratings.
- **No fake leaderboards.** No mock leaderboard for a vertical that has no
  real session/scoring logic behind it.
- **No fake POS queues.** Do not show a POS3 purchase queue card for a
  vertical with no real purchase-intent backend.
- **No fake E.A.T. handoffs.** Do not show an E.A.T. operational handoff
  card for a vertical with no real handoff logic.
- **No fake backend tables/routes.** Do not stub out `/api/<vertical>/*`
  routes that return canned success — either build the route honestly or
  don't expose it.
- **No dead tiles.** A Coming Soon tile must be a real, working tile that
  clearly communicates its state — never a tile that looks active but does
  nothing when tapped.
- **Coming Soon tiles must be premium and clear.** Use the existing premium
  dark-glass/gold-accent visual language already established by SmokeCraft
  — no cheap placeholder graphics, no clip art, no generic "lorem ipsum"
  copy.

## Required Coming Soon tile copy

Every not-yet-built vertical tile should communicate, in some combination of
visible text:

> "Coming Soon"
> "Built on the SmokeCraft MVP2 engine"
> "Unlocks after SmokeCraft, POS3, and E.A.T. are complete"

This tells the viewer (founder, investor, or guest) that the underlying
pattern is proven and the vertical is a matter of replication, not an
unproven gamble — without claiming the vertical itself exists yet.

## SmokeCraft's role

SmokeCraft is the **active MVP2 proof** for the CraftHub pattern. It should
be presented as such anywhere the CraftHub shell lists verticals — clearly
distinguished from Coming Soon tiles, since it has real (if not yet
production-deployed) session, scorecard, POS3, and E.A.T. logic behind it.
