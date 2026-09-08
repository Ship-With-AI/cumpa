# Cumpa hosted support operations

## Production boundary

Cumpa has one hosted Supabase production project. Ordinary local development has no hosted-support dependency and never receives deployment or provider credentials. A protected `main` push automatically runs `.github/workflows/deploy-supabase-production.yml`; there is no manual deployment path.

The credential-free `repository-gates` job runs before the serialized `deploy-production` job enters GitHub's protected `production` environment. Only the protected job receives the project ref, deployment credentials, and provider inputs.

The configured package is still built and scanned, but this deployment workflow persists only redacted deployment evidence as a GitHub artifact. Runtime tarballs are not uploaded by this workflow; their distribution requires the separate artifact/notice acceptance gate.

## Default project origin

The sole browser-facing origin is `https://<project-ref>.supabase.co`. The protected executor validates `SUPABASE_PROJECT_REF` immediately before hosted mutation and derives routes only in memory. Do not store a separate public-origin, site URL, redirect URL, GitHub callback URL, or webhook URL input.

Packages and redacted evidence retain the canonical-origin-only boundary: no bare project ref, another Supabase host, credentials, OAuth secrets, personal data, unapproved provider identifiers or provider secrets.

The operator accepted six exact non-secret configuration identifier fingerprints for the reviewed Cumpa CI exposure on 2026-09-08, recorded in `.planning/phases/03-distribution-contract-legal-boundary/03-PUBLICATION-REVIEW.md` under PUB-01. That CI-only disposition covers the reviewed Supabase project ref, GitHub OAuth client ID and historical Stripe price/webhook endpoint IDs. It does not permit secret keys, personal data, new identifier values or additional package contents; keep the raw values out of review records.

## Retirement and release scanning

Plan 02-15 proves **configured absence**, not a configured release. Run:

```sh
node scripts/verify-supabase-support.mjs --retirement-review \
  --output .planning/phases/02-move-the-implementation-to-supabase/02-15-RETIREMENT-EVIDENCE.md
```

It scans tracked ship-relevant content and rebuilt `dist`, then inspects one explicit `development-check` archive created by the runtime producer. Immutable planning/history descriptions and scanner-contract fixtures may describe retired names; credentials remain prohibited. Documented empty Stripe key prefixes are not credential payloads. Evidence records package digests, configured absence, and violations. Disposable archives are cleaned after the check.

The production scanner never builds or packs, and has no default input:

```sh
node scripts/verify-production-artifacts.mjs \
  --archive "$CUMPA_RUNTIME_CUSTODY_DIR/$CUMPA_RUNTIME_ARCHIVE_BASENAME" \
  --expected-sha256 "$CUMPA_RUNTIME_ARCHIVE_SHA256" \
  --evidence "$CUMPA_RUNTIME_EVIDENCE"
```

Use absolute archive/evidence paths. For configured artifacts, provide the canonical origin only through `CUMPA_RELEASE_SUPPORT_SERVICE_URL`; for unconfigured artifacts, leave it unset. The scanner verifies independent archive hashes, legal/runtime inventories, recursive browser assets, native-target facts, and exactly one generated launcher assignment. It emits bounded JSON without origin cleartext or private paths. These checks apply to hash-bound trusted local producer output, not arbitrary hostile tar input.

The production workflow creates one disposable `deployment-check` archive and passes that same environment origin to the verifier. Only redacted Supabase deployment evidence is uploaded; runtime bytes and runtime evidence remain temporary.

## Final evidence contract

Plan 02-17's credential-free collector writes only `02-17-LOCAL-PACKAGE-SECURITY-EVIDENCE.md`. Final review alone writes `02-17-FINAL-EVIDENCE.md` and requires six distinct immutable records:

```sh
node scripts/verify-supabase-support.mjs --final-review \
  --test-deployment PATH --acceptance PATH --promotion PATH \
  --retirement PATH --release PATH --local-package-security PATH \
  --output .planning/phases/02-move-the-implementation-to-supabase/02-17-FINAL-EVIDENCE.md
```

`--check-final` takes the final evidence path plus the same six named inputs and only recomputes bindings. The release input must have a separate immutable `cumpa.release-approval` record bound to its unchanged bytes, GitHub run ID, and package digest.

Detached evidence validation uses explicit deployment inputs, not a receipt discovered in a particular planning directory. Supply `--deployment PATH` with `--check-promotion-evidence`, and with `--check-run-evidence` whenever `--acceptance PATH` is supplied. `--final-review` and `--check-final` use their existing `--test-deployment PATH` for the complete acceptance/promotion chain. Missing inputs and mismatched lineage still fail closed.
