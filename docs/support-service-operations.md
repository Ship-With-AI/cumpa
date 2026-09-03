# Cumpa hosted support operations

## Production boundary

Cumpa has one hosted Supabase production project. Ordinary local development has no hosted-support dependency and never receives deployment or provider credentials. A protected `main` push automatically runs `.github/workflows/deploy-supabase-production.yml`; there is no manual deployment path.

The credential-free `repository-gates` job runs before the serialized `deploy-production` job enters GitHub's protected `production` environment. Only the protected job receives the project ref, deployment credentials, and provider inputs.

## Default project origin

The sole browser-facing origin is `https://<project-ref>.supabase.co`. The protected executor validates `SUPABASE_PROJECT_REF` immediately before hosted mutation and derives routes only in memory. Do not store a separate public-origin, site URL, redirect URL, GitHub callback URL, or webhook URL input.

The public origin may appear only as that complete canonical URL or a documented Auth/function route derived from it. Never expose the bare ref, another Supabase host, credentials, OAuth or PII values, provider IDs, or provider secrets in packages, logs, or evidence.

## Retirement and release scanning

Plan 02-15 proves **configured absence**, not a configured release. Run:

```sh
node scripts/verify-supabase-support.mjs --retirement-review \
  --output .planning/phases/02-move-the-implementation-to-supabase/02-15-RETIREMENT-EVIDENCE.md
```

It scans tracked ship-relevant content, rebuilt `dist`, the `npm pack --dry-run --json` inventory, and the extracted package. Immutable planning/history descriptions and scanner-contract fixtures may describe retired names; protected values are never permitted. The evidence records the scope, package digests, configured-absent status, and zero violations.

The production scanner defaults to configured absence:

```sh
node scripts/verify-production-artifacts.mjs
```

Its capability mode is deliberately fixture-only until Plan 02-16:

```sh
node scripts/verify-production-artifacts.mjs \
  --expected-support-origin https://<project-ref>.supabase.co \
  --require-configured-launcher dist/bin/cumpa.mjs
```

That mode accepts exactly one launcher assignment and the supplied canonical origin/routes; it rejects a missing, duplicate, different, or bare-ref origin and every protected or retired value. Only Plan 02-16 may run it against a real configured launcher.

## Final evidence contract

Plan 02-17's credential-free collector writes only `02-17-LOCAL-PACKAGE-SECURITY-EVIDENCE.md`. Final review alone writes `02-17-FINAL-EVIDENCE.md` and requires six distinct immutable records:

```sh
node scripts/verify-supabase-support.mjs --final-review \
  --test-deployment PATH --acceptance PATH --promotion PATH \
  --retirement PATH --release PATH --local-package-security PATH \
  --output .planning/phases/02-move-the-implementation-to-supabase/02-17-FINAL-EVIDENCE.md
```

`--check-final` takes the final evidence path plus the same six named inputs and only recomputes bindings. The release input must have a separate immutable `cumpa.release-approval` record bound to its unchanged bytes, GitHub run ID, and package digest.
