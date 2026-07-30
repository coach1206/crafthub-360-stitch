# Failures Found and Fixed — Stage 5 Closure Gate

## SC-D062 — permanently closed (was previously only documented)

See `01-sc-d062-closure-proof.md` for full detail. The dormant
client-controlled-XP/badge legacy rewards route was removed entirely
from `goldenBoxController.js` and `goldenBoxRoutes.js`, verified live
(404), and protected by a new permanent regression check.

## SC-D063 — new, found live via the Stage 5 closure integration journey

`goldenBoxController.js`'s `identityFrom()` never applied the `user:`
prefix that `convertGuestToAccount()` uses when transferring Golden
Box entries — the same SC-D055 defect class already fixed once for
`bridgeIdentity` (SC-D058), independently present for the
`requireAuth`-only results/award visibility routes. A converted
account viewing their own finalized results or award through these
specific routes silently resolved to the wrong viewer role and lost
visibility into their own real, finalized data.

**How it was found**: this was the very first time the full guest →
draft → account-conversion → judge-assignment → scorecard → results-
finalization → award-issuance chain was exercised as ONE continuous,
live, connected journey rather than piecewise across separate passes
— exactly the kind of defect the Stage 5 Closure Gate's own integration
journey requirement exists to catch.

**Fix**: `identityFrom()` now prefixes any authenticated non-guest
`req.user.id` with `user:`, matching `bridgeIdentity`'s established,
already-correct pattern exactly.

**Verification**: the full 22-step integration journey passes
end-to-end after the fix; every existing cross-user-denial assertion
across all five Golden Box regression suites (127 total assertions)
still passes — confirming the fix restores the legitimate owner's
visibility without loosening any authorization boundary for anyone
else.

## No other defects found

All 20 build-blocking validators, all 7 live API regression suites
(158 assertions), and all 3 live browser suites (40 assertions) passed
clean on this pass's first or (for the two defects above) corrected
run. No other Stage 5 integration, security, synchronization, or
regression defect was found.
