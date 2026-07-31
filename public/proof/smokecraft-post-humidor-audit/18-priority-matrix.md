# Priority Matrix

| Item | Priority | Investor-demo impact | Data-integrity impact | Security impact | Est. size |
|---|---|---|---|---|---|
| Dev-default secrets in production | **P0** | None (dev/demo only) | None | High — real deploy with default secrets is a real credential risk | Small (config only) |
| `body-parser`/`react-router`/`react-router-dom` known vulnerabilities | **P1** | None | Low | Moderate (per advisories) | Small–Medium (dependency bump + regression re-test) |
| Real payment gateway | **P1** (production launch), not required for demo | None (demo works without it) | N/A | High if skipped at real launch | Large — separate dedicated package |
| Production monitoring/alerting layer | **P2** | None | None | Indirect (slower incident detection) | Medium |
| Curriculum quiz/interaction coverage gap (18/21 sessions unconfirmed) | **P2** | Low (demo can target confirmed sessions) | None | None | Medium (content review, possibly scripted re-audit) |
| Challenge Hub live end-to-end re-walk | **P3** | Low | None | None | Small |
| Curriculum-level leaderboard tie-breaker verification | **P3** | None | Low | None | Small |
| Real beverage catalog for pairing | **P4** | None (abstract-category pairing already works) | None | None | Large, explicitly deferred |
| Support-doc currency review | **P4** | None | None | None | Small |
| SC-D002 portrait-asset replacement | **P4** | Low (already disclosed, safely letterboxed) | None | None | Small |

## Ranking rationale

Nothing in this audit rose to a P0 "blocks safe use or corrupts data"
finding *in the application's current functional behavior* — the one
P0 item (dev-default secrets) is a **deployment-configuration** risk,
not a functional defect, and does not block the current investor demo
or any current test suite. No P1 item blocks the investor demo either
— both P1 items are pre-launch production requirements, correctly
separated from demo readiness (which this audit confirms is already
achievable today).
