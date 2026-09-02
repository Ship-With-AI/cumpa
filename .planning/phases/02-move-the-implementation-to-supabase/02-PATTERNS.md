# Phase 02: Move the implementation to Supabase — Default-origin pattern map

**Mapped:** 2026-08-31
**Scope:** corrective replan for replacing `SUPPORT_PUBLIC_ORIGIN` custom-domain routing with the sole project's default `SUPABASE_URL` origin.
**Files analyzed:** verifier, workflow, support composition/client, route evidence, package/build scanners, operations documentation, and plans 02-08 through 02-17.
**Read-only planning artifact:** no source, plan, context, roadmap, state, or completed summary was changed.

## Locked cutover

Use one canonical public origin: `https://<project-ref>.supabase.co`. The project ref is public routing data only when embedded in that origin. Do not add a second URL/configuration path. Derive all routes from that origin in protected CI (prefer deriving from the protected management project ref in memory):

- Auth callback: `${SUPABASE_URL}/auth/v1/callback`
- `support-api`: `${SUPABASE_URL}/functions/v1/support-api`
- `support-flow`: `${SUPABASE_URL}/functions/v1/support-flow`
- `stripe-webhook`: `${SUPABASE_URL}/functions/v1/stripe-webhook`
- release capability URL: the same canonical origin (with the existing function path contract)

Delete custom-domain add-on/DNS/reverify/activate steps, custom-origin validation and rejection, custom-origin route flags/evidence, and ref-free/ref-free-package requirements. There is no proxy, alternate front door, or compatibility alias. Keep management credentials protected; the default origin and project ref are intentionally public routing data.

Default-domain Edge Functions rewrite `text/html` to `text/plain`; hosted completion and invalid-state responses therefore need bounded plain-text bodies, not an HTML-dependent flow.

## File classification

| Existing/new surface | Role | Data flow | Closest reusable pattern | Cutover assignment |
|---|---|---|---|---|
| `scripts/verify-supabase-support.mjs` | verifier/utility | transform, request-response, deployment batch | `strictOrigin`, `publicRoutes`, `protectedInputs`, `guardTarget`, `guardedMutation`, evidence validators | Canonical URL parser/route derivation; remove custom-origin rules and domain mutations; retain protected inputs, complete-ref canonical-shape validation, immediate guards, redaction, evidence schemas, route probes, hostile executor, exact cleanup, and six-table snapshots. Evidence fingerprints, if retained, are internally derived supplemental correlation. |
| `.github/workflows/deploy-supabase-production.yml` | CI config | batch/deployment | existing `repository-gates` → `deploy-production` jobs | Keep unfiltered `push` to `main`, credential-free gates, protected `production` environment, serialized job, schema-before-functions and verifier invocation; map only `SUPABASE_URL`/derived routes and remove custom-origin envs/steps. |
| `src/server/support-client.ts` | hosted client/service | request-response | `createHostedSupportClient` HTTPS URL validation, bounded JSON, abort/timeout | Keep one configured HTTPS capability boundary and response limits. The configured value is the canonical default origin; do not accept a custom-origin or second URL. |
| `src/server/capabilities.ts` | capability/orchestrator | request-response + polling | `createSupportCapability`, `promote`, `refresh` | Preserve hosted action handoff and verified-only monotonic promotion. No URL construction or auth session belongs here. |
| `src/server/app.ts`, `src/cli/run.ts` | composition/factory | request-response | `createConfiguredSupportCapability` and injected `support` option | Preserve the existing single gate: absent/invalid hosted URL means no support capability, no support routes, no polling, and no network calls; configured canonical HTTPS origin enables the existing path. |
| `src/server/routes.ts` | route/controller | request-response | conditional `capabilities.support` route block; strict empty-body/query checks | Keep status/start/refresh route behavior and generic bounded errors; route evidence must target derived default-origin function URLs, not custom-origin flags. |
| `supabase/functions/support-api`, `support-flow`, `stripe-webhook` | Edge Functions | request-response, redirect, event-driven | completed function contracts and Deno tests | Keep function boundaries, JWT-disabled public entry with internal auth/signature checks, OAuth PKCE, server-priced Checkout, raw webhook signature and transactional fulfillment. `support-flow` completion/invalid states are bounded plain text. |
| `tests/e2e/support-payment.spec.ts` | test | transform/verifier + browser acceptance | `execFile` verifier rejection tests; payment journey destination | Update verifier fixtures/options and route assertions to canonical default origin; retain optional payment, webhook-only authority, polling, cancellation/delay, unrestricted review. |
| `tests/e2e/support-recovery.spec.ts` | test | transform/verifier + browser acceptance | fail-closed evidence tests using temporary JSON and `reject` helper | Replace custom-origin evidence/options with default-origin acceptance; preserve schema/raw-value/route/redaction rejection and OAuth privacy assertions. |
| `tests/e2e/support-restore.spec.ts` | test | transform/verifier + browser acceptance | fixture-manifest, hostile-lineage and conflicting-option rejection | Keep repeated restore, non-enumeration, exact manifest and promotion-lineage checks; canonicalize `public_origin`/route expectations. |
| `tests/e2e/package-assets.spec.ts` | test/scanner | build/package I/O | `npm run build`, `npm pack --json --ignore-scripts`, tar extraction, inventory assertions | Allow only canonical public default origin in packed release; reject credentials, arbitrary refs outside the canonical host, OAuth/PII/provider secrets and legacy custom-domain machinery. |
| `scripts/build-bin.mjs` | build utility | file I/O/transform | minimal `dist/bin/cumpa.mjs` launcher | Keep minimal launcher/build cleanup; release workflow injects only the public canonical origin through the existing configured-release mechanism. |
| `docs/support-service-operations.md` | operations/runbook | deployment/evidence batch | current protected-main order and redacted evidence guidance | Rewrite custom-domain prerequisite/order as default-origin derivation; document no domain add-on/DNS/reverify/activate/proxy while retaining environment protection, guards, schema-first deploy and smoke evidence. |
Protected `production` owns the public `SUPABASE_PROJECT_REF` variable and every credential/provider input. Exact canonical origin plus immutable GitHub run/commit proves the target across records; an internally derived fingerprint may supplement redacted correlation. No duplicate public URL or target-digest input crosses the boundary.
| `02-11`–`02-14` deletion/toolchain plans | deletion/config | file I/O/build | exact absence gates and lockfile cleanup | Legacy Render/Node/Postgres/Resend deletion is unchanged; do not delete active Supabase CLI/functions or local Fastify. Remove only custom-origin references exposed by the retirement scan. |
| `02-15`–`02-17` scanner/release/final evidence | scanner/release/evidence | transform, package I/O, batch | six-input final digest contract and package scanner | Scanner allowlist is canonical default origin only; final evidence binds deployment, acceptance, promotion, retirement, release and local/package/security records without secrets/raw refs. |

## Pattern assignments

### Verifier: `scripts/verify-supabase-support.mjs`

**Reuse:** Keep `TABLES`, `HOSTILE_CASES`, `MODES`, `PROTECTED_INPUTS`, `RAW_VALUE_KEY`, `sha256`, `requireString`, `isHash`, `protectedInputs`, `guardTarget`, `guardedMutation`, `snapshotAuthority`, `probeRoutes`, evidence read/write, manifest validation, hostile executor and promotion validators.

**Replace `strictOrigin` (currently around lines 53–65):** parse exactly one `SUPABASE_URL`; require HTTPS, no credentials, path `/`, query/hash/port absent, and hostname matching the validated project-ref domain shape (`<project-ref>.supabase.co`). Reject arbitrary hosts, malformed refs, and any origin not derived from the complete protected ref. Do not retain `SUPPORT_PUBLIC_ORIGIN` or a custom-origin rejection message.

**Replace `publicRoutes` (currently around lines 67–75):** accept the canonical origin and append the four fixed paths above. Derive it once from the in-memory project ref/`SUPABASE_URL`; all Auth/OAuth/function/webhook/release route values must compare against this result. Do not store five independent URL variables.

**Mutation order:** delete `managementRequest(.../domains)`, `domains-reverify`, and `domains-activate`. Preserve the exact sequence and immediately validate `SUPABASE_PROJECT_REF` against the canonical 20-character shape before every remaining hosted mutation: schema migration first, then Auth/provider configuration, function secrets, and function deployment. GitHub protected-environment ownership is the target authority; do not compare a configured hash.

**Verifier CLI/evidence:** remove `--require-custom-domain`, `--require-custom-domain-routes`, custom-domain readiness flags, and custom-origin evidence assertions. Replace them with canonical-default-origin route/evidence checks. Continue rejecting raw credentials, OAuth/PII, provider secrets, arbitrary project refs, and URLs whose host is not the sole canonical default host. Route probes remain non-mutating and authority snapshots before/after must match.

### Workflow: `.github/workflows/deploy-supabase-production.yml`

Copy the current job boundary: `repository-gates` has no protected inputs and runs Node 24, Deno 2.7.14, Vitest, Playwright, Deno tests and local Supabase DB checks; `deploy-production` alone uses `environment: production` and protected deployment/provider inputs. Keep `push: branches: [main]`, concurrency serialization, no `workflow_dispatch`, no path filter, and no local deployment/provider mode.

**Protected inputs:** retain `SUPABASE_PROJECT_REF` as a protected `production` environment variable, deployment credentials, GitHub/Stripe provider inputs, provider mode, Price ID, and webhook endpoint ID. Delete every duplicate URL input and every configured ref hash/fingerprint input. Derive URLs in memory from the shape-validated ref.

### Support client and local composition

`src/server/support-client.ts` already provides the right narrow boundary: `createHostedSupportClient`, `HostedSupportClient.start/status/close`, `new URL`, HTTPS validation, `responseJson` 8 KiB bounds, timeout and abort behavior, strict response schemas, and `undefined` on malformed/non-2xx/network failure. Keep this behavior with the sole canonical default origin; do not add a custom-origin fallback or accept Supabase credentials/session tokens.

`src/server/capabilities.ts:147–162` is the authority pattern:

```ts
const status = async () => ({ status: (await store.state()).status });
const promote = async (remote: 'unverified' | 'verified' | undefined) => {
  if (remote === 'verified') await store.markVerified(new Date().toISOString());
  return await status();
};
// refresh asks hosted status; only verified can promote, never demotes locally.
```

`src/server/app.ts:46–57` and the corresponding CLI factory call are the composition pattern. Construct the hosted client/store only after a valid explicit HTTPS capability URL; omit `support` entirely when absent. Preserve injected capabilities for tests and exact-patch launch paths. This is local support disablement, not a second configuration path.

### Route and hosted response evidence

Use `src/server/routes.ts`'s existing conditional support block (around lines 132–145): parse strict start input, reject malformed/extra body and non-empty refresh query/body/headers, call capability, and serialize Zod-validated responses. Use `support-client` bounds and generic errors as the response safety pattern.

Route probes must call the four canonical default-origin paths and assert expected invalid-input/status responses without creating authority rows. `support-flow` probes and browser completion/invalid-state checks must assert bounded `text/plain` output because default Supabase domains rewrite `text/html`; no HTML/custom-domain assumption survives.

### Package build and scanners

`tests/e2e/package-assets.spec.ts` is the closest package oracle: build via `runPrerequisite`, `npm pack --json --ignore-scripts`, inventory tar contents, reject `src/`, TypeScript/Vue, `services/support/`, env/secrets, extract archive, then inspect bundled JS. Extend the deny-list to include `SUPPORT_PUBLIC_ORIGIN`, custom-domain/DNS/activation machinery, arbitrary project refs, Supabase management credentials, GitHub client secret/OAuth tokens, Stripe secrets, PII and provider identifiers. Permit only the exact canonical public default origin. A route host with a different ref or arbitrary `.supabase.co` project must fail.

`tests/e2e/support-payment.spec.ts` owns verifier CLI and workflow regression fixtures; migrate malformed workflow/options and route/ordering assertions there. `support-recovery.spec.ts` owns fail-closed evidence/raw-value checks; `support-restore.spec.ts` owns hostile matrix, fixture manifest and promotion option checks. Keep each assertion in its existing closest suite; do not create compatibility tests for deleted flags.

### Operations and evidence

Rewrite `docs/support-service-operations.md`'s “Custom-domain prerequisite” into a sole-project default-origin section: no paid add-on, DNS, proxy, custom domain, or `supabase domains` commands. Explain that the protected environment owns the public project ref variable, CI validates its canonical 20-character shape immediately before each mutation, and Auth/function/webhook/release routes derive from it. Retain the automatic protected-main trigger, repository-gates isolation, environment ownership, schema-before-functions, redacted immutable evidence, and non-destructive live smoke. Any evidence fingerprint is internally derived supplemental correlation.

Plans 02-08–02-10 must own the corrected deployment/acceptance/promotion contract: no custom-domain setup or activation, but canonical route reachability and zero-state evidence remain. Plans 02-11–02-14 retain deletion and dependency cleanup unchanged. Plans 02-15–02-17 retain retirement scanner, configured release and six-record final evidence, changing only origin allowlists, scanner inputs and route assertions. Completed 02-01–02-07 artifacts remain historical and byte-for-byte untouched; plan 02-08 owns the corrective cutover before any push.

## Shared patterns

### Protected mutation guard
`guardTarget(inputs)` requires `SUPABASE_PROJECT_REF` from the protected `production` environment and validates its exact canonical 20-character form. `guardedMutation` records operation order and invokes the guard immediately before every mutation. Only after validation derive `https://<ref>.supabase.co`. If evidence retains `fingerprint`, derive SHA-256 internally from the ref solely for redacted correlation. Never read, configure, approve, or compare an independent fingerprint.

### Canonical route derivation
One validated `SUPABASE_URL`/project-ref pair produces all public routes. Auth, OAuth callback, `support-api`, `support-flow`, `stripe-webhook`, release configuration and route probes must consume derived values. Never reintroduce `SUPPORT_PUBLIC_ORIGIN`, duplicate URL variables, custom domain, proxy or fallback host.

### Local-disabled behavior
Absent/invalid `CUMPA_SUPPORT_SERVICE_URL` continues to mean no hosted capability and no support routes/UI/polling/network calls. When explicitly configured, it must be the canonical public default origin. Local app never receives Supabase session, OAuth code/token, provider secret or management credential.

### Evidence and redaction
Evidence may contain canonical public origin and its exact derived routes in typed fields. Reject the bare ref elsewhere, every other `.supabase.co` origin, credentials, OAuth/PII, provider material, and raw fixture values. Cross-record authority requires exact canonical origin plus immutable GitHub commit/run lineage; derived fingerprint consistency is supplemental only.

### Clean deletion
Delete custom-domain machinery and legacy Render/Fastify support service only where explicitly obsolete. Preserve active local Fastify review server, Supabase migrations/functions, support store, capability/client contracts, and completed plans/summaries. No fallback, archive, alias, second config path or compatibility endpoint.

## Obsolete custom-domain machinery

Remove from active source/workflow/docs/tests/evidence contracts:

- `SUPPORT_PUBLIC_ORIGIN` protected variable and all duplicated `SUPABASE_SITE_URL`, `SUPABASE_REDIRECT_URL`, `SUPABASE_GITHUB_CALLBACK_URL`, `STRIPE_WEBHOOK_URL` configuration when derivable.
- `strictOrigin` rules requiring “ref-free custom origin” or rejecting all `.supabase.co` hosts.
- `publicRoutes` custom-origin assumptions and custom-domain route/evidence CLI flags.
- Supabase Custom Domain add-on, DNS CNAME/TXT setup, domain registration/reverify/activate and `supabase domains` commands.
- workflow mutation steps and evidence fields dedicated to custom-domain activation/reachability.
- package/scanner rules requiring ref-free hosts or banning the canonical default origin.

Retain the legacy service deletion list from 02-11 through 02-14 (Render descriptor, standalone schema/db/config, Resend/email recovery, Node support runtime/routes/tests/tooling) exactly as planned; it is separate from the default-origin correction.

## No analog / research-only

| Surface | Why no existing analog |
|---|---|
| Default Supabase origin/ref validation and derivation | Existing verifier encodes the now-obsolete custom-domain policy; adapt its parser rather than inventing a second routing module. |
| Plain-text default-domain completion/invalid-state behavior | Existing code/research assumed HTML-capable custom domain; use bounded `Response` text bodies and tests for content type/body limits. |
| One-time hosted acceptance against the sole project | Existing tests are local/provider-mocked; retain plan 02-09's browser/provider evidence contract, changing only origin and route expectations. |

## Metadata

**Analog search scope:** `scripts/verify-supabase-support.mjs`, `.github/workflows/deploy-supabase-production.yml`, `src/server/{app,capabilities,routes,support-client}.ts`, `tests/e2e/{support-payment,support-recovery,support-restore,package-assets}.spec.ts`, `scripts/build-bin.mjs`, `docs/support-service-operations.md`, plans 02-08 through 02-17, existing `02-PATTERNS.md` and `02-RESEARCH.md`.
**Closest tests:** verifier rejection tests in the three support E2E specs; package inventory/extraction in `package-assets.spec.ts`; configured/local-disabled support dialog integration and existing Deno function tests.
