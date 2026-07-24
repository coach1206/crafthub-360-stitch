# 02 — Proxy Security: the trust-proxy hop-count decision

## The setting
```js
const TRUST_PROXY = IS_PROD ? 1 : false
app.set('trust proxy', TRUST_PROXY)
```

## What `trust proxy` controls
It tells Express how many entries at the **right** end of the `X-Forwarded-For`
chain are trustworthy infrastructure. `req.ip` is then taken from the first
value to the *left* of those trusted hops. Rate limiting, and any IP-dependent
auth/logging, key off `req.ip`.

## Why exactly `1` in production (not `true`)
Railway's topology puts **one** reverse proxy (its edge) in front of the app. That
edge overwrites/append the connecting client's IP as the rightmost XFF entry.
Trusting exactly 1 hop means Express reads *that* edge-appended value as the
client IP and ignores anything further left.

`trust proxy = true` trusts the **entire** chain, however long. Any client can
send `X-Forwarded-For: <arbitrary-spoofed-ip>` in its own request; with `true`,
Express would treat that attacker-controlled leftmost value as `req.ip`. An
attacker could then:
- rotate a fresh spoofed IP per request to **evade per-IP rate limiting**
  entirely (defeating the very limiter this bug is about), and
- poison any IP-based auth throttling or audit logging.

A fixed hop count of `1` closes that: the attacker's own header entries sit to
the left of Railway's trusted single hop and are discarded.

## Why `false` in local development
Local dev and the CI/test servers accept **direct** connections with no reverse
proxy. There is no legitimate trusted hop to count. Setting `1` (or `true`) there
would trust a phantom hop — meaning a locally-connecting client's own spoofed
`X-Forwarded-For` would be honored, which is exactly the spoofable
misconfiguration we are avoiding in production. `false` makes `req.ip` the real
socket peer, which is correct for direct connections. (In practice the limiters
also `skip: () => !IS_PROD`, so they are inert in dev regardless; `false` keeps
`req.ip` honest for any other IP-dependent code paths.)

## Ordering guarantee
`app.set('trust proxy', …)` is an app-level setting read at request time, and it
is placed immediately after `const app = express()` — textually before the
`rateLimit({...})` definitions, before `app.use('/api/auth', authLimiter)` /
`app.use('/api', generalLimiter)`, and before every route registration. Check (1)
of the new suite asserts this ordering by reading `server/index.js` source.

## Escalation criteria
If Railway's topology ever grows an additional trusted hop (e.g. a second
internal proxy), bump the count to the exact number of trusted hops — never to
`true`. There is currently no evidence of more than one hop.

## Boot diagnostic
On startup the server logs (no PII, no bodies, no tokens): environment, the
resolved `trust proxy` value, what `req.ip` resolves from, and whether the rate
limiter is enabled. This makes a future misconfiguration visible at deploy time.
