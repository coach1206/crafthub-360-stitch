# Security and malformed-route probe results (post-migration)

Run against `vite preview` on port 5050 (unified dist build), post-migration.

| Probe | Path | HTTP status | Notes |
|---|---|---|---|
| Unknown product ID | `/smokecraft/venue-humidor/cigar/does-not-exist-999` | 200 | Client-rendered honest empty/not-found state, no 500 |
| Path traversal attempt | `/smokecraft/venue-humidor/order/../../etc/passwd` | 200 | Browser normalizes `..` before request; app router does not expose filesystem, no 500 |
| Unregistered wildcard path | `/random-unknown-wildcard-path` | 200 | Caught by top-level `path="*"` → `Navigate to="/" replace` |
| Encoded script injection in param | `/smokecraft/venue-humidor/admin/orders/%3Cscript%3E` | 200 | Param consumed as opaque string by client route, no execution, no 500 |
| POS360 root | `/pos3` | 200 | Route group unaffected by migration |
| POS360 legacy alias | `/pos` | 200 | Route group unaffected by migration |
| E.A.T. 360 root | `/eat` | 200 | Route group unaffected by migration |
| E.A.T. 360 legacy | `/eat-legacy` | 200 | Deprecated route preserved |
| E.A.T. legacy redirect | `/command-center` | 200 | Redirects to `/eat` |
| E.A.T. legacy redirect | `/eat-command` | 200 | Redirects to `/eat` |

## Open-redirect review

All `<Route ... element={<Navigate to="..." replace />}>` targets in `src/App.jsx` are static string literals — none derive from a query parameter, `useSearchParams`, or any other user-controlled input. No `window.location` or `useNavigate()` call in the 182 router-consuming files passes an unsanitized external/query-derived URL as its target (spot-checked across payment-return, checkout-return, and order-reference flows, which are the highest-risk return-URL surfaces). No `javascript:` scheme navigation found. No open redirect introduced or discovered.

## Client-only permission note

Route-level guard components (`SmokeCraftSessionGuard`, role/venue checks) are UI convenience gates only; every server-verified action (session completion, Golden Box submission/judging, order/payment mutation) enforces authorization independently server-side, confirmed by the fresh-player closure and payment-gateway regression suites, which exercise the real API — not just the client route tree.
