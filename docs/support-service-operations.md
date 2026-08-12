# Cumpa support service operations

## Deploy

Deploy `render.yaml` as a Render Blueprint. It creates the loopback-independent Node web service `cumpa-support` and `cumpa-support-db`. Render runs `npm ci`, starts `npm start`, and probes `/healthz`. Before production traffic, run `node scripts/migrate.mjs` from `services/support` with Render's `DATABASE_URL`; migrations create `entitlements`, `installation_bindings`, `stripe_events`, `recovery_challenges`, and `recovery_rate_limits`.

Set these server-only variables: `DATABASE_URL` (Render database connection), `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `STRIPE_PAYMENT_LINK_ID`, `RESEND_API_KEY`, `EMAIL_LOOKUP_HMAC_KEY`, and `RECOVERY_TOKEN_HMAC_KEY`. Set public service variables `PUBLIC_BASE_URL`, `EMAIL_FROM`, `HOST`, `PORT`, and `NODE_ENV=production`. Render generates the two HMAC keys; never copy a test value to live. Use distinct Stripe webhook endpoint secrets for test and live endpoints.

Create a card-only Stripe USD 49.99 Price and Payment Link: quantity exactly one, no adjustable quantity, optional items, discounts, delayed payment methods, automatic tax, or alternative prices. Configure the endpoint `POST /v1/stripe/webhook` for `checkout.session.completed`. Verify the Resend sender domain and use its verified address as `EMAIL_FROM`.

## Routine operations

Take PostgreSQL backups through Render and restore one backup into an isolated database quarterly; run migration and verify `/healthz` before declaring recovery complete. Rotate Stripe API/webhook, Resend, and HMAC keys one at a time: deploy replacement configuration, validate a signed test event/recovery request, then revoke the old secret. Do not log email, magic token, Stripe signature, API key, or database URL. Recovery applies IP/email rate limits; investigate abnormal limits through redacted event counts only.

Stripe delivery is idempotent through `stripe_events`. Replay the original signed event through Stripe's dashboard only after confirming its event ID and deployment configuration; repeated delivery must remain HTTP 200 without a second grant.

## Test-mode smoke record

This must be completed against deployed providers before release; synthetic Stripe CLI events alone are insufficient because Payment Link configuration is part of the proof.

1. On an unverified installation, complete the configured test-mode Payment Link with a test card and a unique installation reference. Record the redacted Stripe event ID, the deployed webhook HTTP 200, the server-side retrieved Session/line-item invariant, and the subsequent verified installation status.
2. Close, redirect, or abandon Checkout from a different installation. Record that it remains `unverified`; neither redirect nor tab closure proves payment.
3. Request recovery for a paid email. Record generic HTTP 202, Resend delivery ID and receipt, and redacted logs. Opening the magic URL with GET must remain inert. Its consuming POST must cause verified poll/status. A second POST must be rejected/no-op.
4. Inspect logs and evidence for absence of plaintext email, raw token, signature, API key, and database URL.

| Date | Stripe event/status | Resend delivery/single use | Operator |
| --- | --- | --- | --- |
| Pending deployed-provider approval | Pending | Pending | — |
