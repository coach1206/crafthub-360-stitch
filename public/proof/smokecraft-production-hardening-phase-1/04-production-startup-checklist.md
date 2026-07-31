# Production Startup Checklist

Also mirrored, in placeholder form, at the bottom of `.env.example`.

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` set to the real production Postgres connection
      string
- [ ] `JWT_SECRET` set — 32+ random characters, not a known-unsafe
      placeholder (generate with `openssl rand -hex 32`)
- [ ] `FOUNDER_CHALLENGE_SECRET` set — same requirement as `JWT_SECRET`
- [ ] `CORS_ORIGIN` set to the real production frontend origin (a full
      `https://` URL — never `*` or `true`)
- [ ] `AUTH_COOKIE_SECURE=true`
- [ ] `ALLOW_DEV_FOUNDER` unset or `false`
- [ ] `SESSION_SECRET` either unset, or 32+ random characters if used
- [ ] `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` set only if the
      Stripe integration is actually being enabled for this deployment
- [ ] `ELEVENLABS_API_KEY` set only if real mentor-voice synthesis is
      desired
- [ ] Confirm the server logs `[EnvValidator] ✓ Environment
      configuration OK` (or only pre-approved warnings) on startup —
      if it logs any `✖` error, the server will not start
- [ ] Confirm security headers are present on a live request (`curl -I
      https://<production-domain>/api/health` should show
      `Content-Security-Policy`, `Strict-Transport-Security`, and
      `X-Content-Type-Options: nosniff`)
- [ ] Confirm `npm audit --production` shows only the documented,
      unresolved `react-router`/`react-router-dom` advisories (see
      `02-dependency-vulnerability-review.md`) — anything new should
      block the deploy pending review
- [ ] Rotate any secret that may have been exposed (logged, committed,
      or shared) before reusing it in production
