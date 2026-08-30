# Cumpa hosted support operations

## Production boundary

Cumpa has one hosted Supabase production project. Ordinary local development has no hosted-support dependency and never deploys, configures providers, or receives deployment credentials. GitHub Actions is the sole deployment path: every push to protected `main` runs `.github/workflows/deploy-supabase-production.yml`.

The `repository-gates` job is credential-free. It sets up Node 24 and Deno 2.7.14, runs the repository test gates, and validates the local database before the `production` environment is requested. The serialized `deploy-production` job is the only job bound to that environment and the only process allowed to access protected deployment inputs.

## Custom-domain prerequisite

Before the first protected push, register one HTTPS subdomain in the Supabase Dashboard. Follow Supabase's [custom-domain guide](https://supabase.com/docs/guides/platform/custom-domains): create its CNAME record and required TXT ownership record, then wait for DNS propagation. Configure the OAuth provider with the custom-origin callback `/auth/v1/callback` before activation.

`SUPPORT_PUBLIC_ORIGIN` is that one ref-free custom origin. It supplies the Auth callback and all browser-facing routes:

- `/auth/v1/callback`
- `/functions/v1/support-api`
- `/functions/v1/support-flow`
- `/functions/v1/stripe-webhook`

The default project domain remains internal service plumbing only; it is never a browser, OAuth, webhook, or package URL.

## Automatic deployment order

After repository gates pass, the protected verifier keeps protected values in memory, validates their complete set and approved full-ref SHA-256 fingerprint, then repeats that fingerprint guard immediately before each hosted mutation:

1. discover custom-domain state without mutation;
2. reverify and activate the registered custom domain;
3. apply database migrations;
4. configure Auth/provider settings;
5. update Edge Function secrets;
6. deploy `support-api`, `support-flow`, then `stripe-webhook`;
7. run custom-origin route probes and record authority counts.

The workflow emits only an immutable, redacted evidence artifact: run and commit identity, approved fingerprint, display suffix, custom origin, activation state, deployment order, route signatures, versions, counts, hashed handles, and artifact digest. It excludes project refs, credentials, provider values, OAuth material, personal data, and raw fixture keys.

The prelaunch hostile matrix runs only in the protected job, only in test mode, and only when the committed acceptance marker is present. Production-live runs remain non-destructive and may perform only read-only status and route smoke checks.

## Operations response

For a failed release, make a compatible forward fix and push `main`; do not add a manual deployment path, bypass the environment gate, or run destructive acceptance activity against live authority. Keep the workflow evidence with the corresponding GitHub run for audit and rollback diagnosis.
