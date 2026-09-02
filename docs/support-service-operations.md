# Cumpa hosted support operations

## Production boundary

Cumpa has one hosted Supabase production project. Ordinary local development has no hosted-support dependency and never receives deployment or provider credentials. A push to protected `main` automatically runs `.github/workflows/deploy-supabase-production.yml`; there is no manual deployment path.

The credential-free `repository-gates` job validates the repository and local database before the serialized `deploy-production` job enters GitHub's protected `production` environment. Only that job receives protected inputs and can mutate the project.

## Default project origin and protected inputs

The sole browser-facing origin is `https://<project-ref>.supabase.co`. The protected executor reads the complete `SUPABASE_PROJECT_REF` from a protected environment variable, validates its canonical shape, then derives that origin only in memory. Do not store a separate public-origin, site URL, redirect URL, GitHub callback URL, or webhook URL input.

`production` owns only the Supabase management token, project-ref variable, database password, GitHub client ID and secret, Stripe secret key, webhook secret, Price ID, webhook endpoint ID, and `SUPPORT_PROVIDER_MODE`. Keep credentials and provider values out of logs, packages, evidence, and chat; permit the project ref only inside the canonical public origin.

Before the first protected push, configure GitHub OAuth to return to `https://<project-ref>.supabase.co/auth/v1/callback`. This is distinct from the post-auth callback allowlisted by Supabase Auth: `https://<project-ref>.supabase.co/functions/v1/support-flow/callback`. Stripe's webhook endpoint is `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`; subscribe it only to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.

Delete any existing `APPROVED_SUPABASE_PROJECT_REF_SHA256`, `SUPPORT_PUBLIC_ORIGIN`, `SUPABASE_SITE_URL`, `SUPABASE_REDIRECT_URL`, `SUPABASE_GITHUB_CALLBACK_URL`, and `STRIPE_WEBHOOK_URL` environment entries without reading or recording their values.

## Automatic deployment and evidence

After repository gates pass, the protected executor validates the complete ref's canonical shape immediately before each hosted mutation. It applies database migrations, patches GitHub Auth with the derived completion and callback routes, sets the three Stripe function secrets, then deploys `support-api`, `support-flow`, and `stripe-webhook` in that order.

The release evidence records the exact public origin, route probes, internally derived correlation fingerprint, immutable GitHub lineage, mutation order, and redacted authority snapshots. It permits only the exact canonical origin and its enumerated routes; a bare project ref, any other Supabase host, credentials, OAuth data, PII, provider identifiers, and provider secrets are rejected.

For a failed release, make a compatible forward fix on `main`. Do not bypass repository gates or the protected environment, and do not run destructive acceptance activity against live authority.
