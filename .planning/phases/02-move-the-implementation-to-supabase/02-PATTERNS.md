# Phase 02: Move the Implementation to Supabase — Pattern Map

**Mapped:** 2026-08-14  
**Files analyzed:** 29 likely created/modified/deleted surfaces  
**Analogs found:** 20 / 29 (9 genuinely new Supabase/deployment surfaces)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `supabase/config.toml` | config | deployment/config | `render.yaml` | role-match; platform-specific |
| `supabase/migrations/<timestamp>_support.sql` | migration/model | CRUD + transactional authority | `services/support/migrations/001_init.sql` | exact data model intent, new platform syntax |
| `supabase/functions/support-api/index.ts` | Edge Function/API | request-response | `services/support/src/routes/installations.ts` | role/data-flow match |
| `supabase/functions/support-flow/index.ts` | Edge Function/auth orchestration | request-response + event/redirect | `services/support/src/routes/recovery.ts` and `src/server/capabilities.ts` | partial; OAuth is new |
| `supabase/functions/stripe-webhook/index.ts` | Edge Function/webhook | event-driven | `services/support/src/routes/stripe-webhook.ts` | exact |
| `supabase/functions/_shared/validation.ts` | utility | transform/validation | `services/support/src/schema.ts` | role-match |
| `supabase/functions/_shared/fulfillment.ts` | service | event-driven + transactional CRUD | `services/support/src/fulfillment.ts` | exact domain pattern |
| `supabase/functions/**/tests/*.test.ts` | test | request-response/event-driven | `services/support/tests/fulfillment.test.ts`, `installations.test.ts`, `recovery.test.ts` | exact test intent; runtime differs |
| `src/server/support-client.ts` | service/client | request-response | itself (current implementation) | exact; replace contracts |
| `src/server/capabilities.ts` | capability/service | request-response + polling | itself, `createSupportCapability` | exact; preserve monotonic promotion |
| `src/server/support-store.ts` | persistence/store | file I/O + CRUD | itself | exact; unchanged behavior |
| `src/contracts/api.ts` | contract/validation | request-response | itself (support schemas) | exact; delete recovery schemas/add start/status |
| `src/server/routes.ts` | route/controller | request-response | itself (support routes) | exact; clean cutover |
| `src/web/api/client.ts` | browser API client | request-response | itself (support calls) | exact; replace recovery calls |
| `src/web/App.vue` | component/orchestrator | polling + request-response | itself (support lifecycle) | exact; preserve cadence/visibility |
| `src/web/components/SupportDialog.vue` | component | request-response/UI state | itself | exact; replace recovery UI |
| `tests/integration/support-dialog.spec.ts` | browser integration test | request-response/polling | itself | exact; OAuth-tab behavior |
| `tests/e2e/support-payment.spec.ts` | E2E test | request-response/eventual consistency | itself | exact; hosted flow assertions |
| `tests/e2e/support-recovery.spec.ts` | E2E test | request-response/polling | itself | exact; rename/adapt to OAuth restore |
| `services/support/src/app.ts` | deleted service/config | request-response | itself | deletion/cutover only |
| `services/support/src/db.ts` | deleted persistence adapter | CRUD/transaction | itself | deletion/cutover only |
| `services/support/src/recovery.ts`, `recovery-store.ts`, `email.ts` | deleted service | event/request-response | itself | deletion/cutover only |
| `services/support/src/routes/*.ts` | deleted routes | request-response/event-driven | itself | deletion/cutover only |
| `services/support/migrations/001_init.sql` | deleted migration | CRUD | itself | deletion/cutover only |
| `render.yaml` | deleted deployment config | deployment | itself | deletion/cutover only |
| `.github/workflows/<supabase-deploy>.yml` | CI config | batch/deployment | no analog | no analog |
| `docs/support-service-operations.md` | operations doc | operational/runbook | itself | role-match; rewrite for Supabase |
| `package.json` / lockfile | config/dependency | build/package | current root package | role-match; remove service boundary/add only required Supabase tooling |

## Pattern Assignments

### `supabase/migrations/<timestamp>_support.sql` (migration/model, CRUD + transactional)

**Analog:** `services/support/migrations/001_init.sql` and `services/support/src/fulfillment.ts`.

The old schema is intentionally a domain reference, not a compatibility target. Preserve the authority concepts (payment event idempotency, checkout/session identity, supporter authority, installation binding), but replace email/recovery tables and payment-link assumptions. Reference `auth.users(id)` only; do not copy profile or payer email fields. Enable RLS on exposed tables and expose no public mutation policies. Put authority transitions in narrowly granted `security definer` RPCs with fixed `search_path`; use unique constraints for concurrency rather than read-then-insert checks.

**Legacy schema pattern** (`services/support/migrations/001_init.sql`, lines 1–~60):
```sql
CREATE TABLE payment_events (... event_id TEXT PRIMARY KEY ...);
CREATE TABLE entitlements (... payment_session_id TEXT UNIQUE NOT NULL ...);
CREATE TABLE installation_bindings (... installation_id TEXT PRIMARY KEY ...);
```

**Reusable transaction invariant:** `fulfillment.ts` validates the retrieved Checkout session, inserts the event idempotently, then creates/updates the entitlement and binding in one transaction. The Supabase migration should encode equivalent uniqueness/foreign-key/check constraints, not a second application-level ledger.

### `supabase/functions/support-api/index.ts` (Edge Function/API, request-response)

**Analog:** `services/support/src/routes/installations.ts` (lines 6–25).

Keep the existing narrow public status boundary: validate an exact 43-character base64url installation ID, query only whether a binding exists, return `{status: 'verified'|'unverified'}`, and return generic bounded errors. Add `POST /start` with an allowlisted `action` (`support` or `restore`) and installation ID; generate/store only a hash of an opaque expiring one-use intent and return a hosted flow URL. Never accept user ID, email, price, Stripe metadata, or a client-authored authority claim.

**Status pattern to copy:**
```ts
const parsed = InstallationIdSchema.safeParse(input.installationId);
if (!parsed.success) return json({ error: 'invalid-installation' }, 400);
const verified = await db.hasBinding(parsed.data);
return json({ status: verified ? 'verified' : 'unverified' });
```

**Validation/error conventions:** strict Zod/explicit validators at the boundary; generic errors; high-entropy identifier only. `verify_jwt = false` is required for this public capability, but it is not an authorization bypass.

### `supabase/functions/support-flow/index.ts` (Edge Function/auth flow, request-response + redirect)

**Analogs:** `services/support/src/routes/recovery.ts` (lines 5–~35) for one-use flow lifecycle, and `src/server/capabilities.ts:148–185` for action/poll state orchestration.

This is a genuinely new OAuth surface. Use a request-scoped, cookie-aware Supabase Auth client, GitHub-only OAuth with exact redirect/state and S256 PKCE, and validate the callback user with `getClaims()`/`getUser()` before consuming the intent. The hosted flow owns the session; do not redirect a token/code to the loopback app or persist OAuth/profile/email data locally. Consume intent exactly once. For support, create a server-side Checkout Session only after authentication; for restore, atomically bind the authenticated paid user to the requesting installation. Return the same generic completion page/result for paid and non-paid restore attempts to avoid enumeration. Browser success/cancel redirects never mark local authority.

**Legacy lifecycle shape to preserve:** recovery route validates request, delegates to a service, returns `202`; status is separately polled with a capability token. The new flow replaces the email/token mechanism rather than preserving route aliases.

**Stripe Checkout fields:** server-selected USD 49.99, `mode: 'payment'`, server-controlled `client_reference_id` and metadata containing Supabase user ID, installation ID, and internal intent/checkout ID; no client-selected amount or email matching.

### `supabase/functions/stripe-webhook/index.ts` (Edge Function/webhook, event-driven)

**Analog:** `services/support/src/routes/stripe-webhook.ts` (lines 10–35).

Preserve the raw-body signature boundary and explicit event filtering:
```ts
const signature = req.headers.get('stripe-signature');
if (!signature) return new Response('invalid-webhook', { status: 400 });
const event = await stripe.webhooks.constructEventAsync(
  await req.text(), signature, Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
  undefined, Stripe.createSubtleCryptoProvider(),
);
if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type))
  return new Response(JSON.stringify({ received: true }), { status: 200 });
```

Delegate to shared fulfillment logic. Retrieve/expand the authoritative session, re-check mode/currency/amount/price/payment status and server metadata, and reject unpaid/wrong-product/wrong-binding input. Call one transaction/RPC that records event ID, upserts supporter authority, binds installation, and marks session fulfilled. Unique event/session constraints handle replay and concurrent deliveries. Never fulfill from a browser success URL.

### `supabase/functions/_shared/fulfillment.ts` (service, event-driven + transactional CRUD)

**Analog:** `services/support/src/fulfillment.ts` (lines 1–~120).

Copy its separation of concerns: `sessionInvariant(...)` rejects malformed or wrong-product sessions before settlement; `fulfillCheckoutSession(...)` uses transaction-scoped operations and handles already-recorded events/bindings idempotently. Remove legacy `normalizeEmail`, `emailLookup`, `customer_details.email`, `payment_link`, and email ownership checks. Replace with Supabase `user_id`/installation/intent metadata and a database RPC/transaction. Keep explicit invalid-payment vs transient-unavailable distinction for webhook response status.

### `supabase/functions/_shared/validation.ts` (utility, transform/validation)

**Analog:** `services/support/src/schema.ts`.

Reuse strict schemas and the existing installation invariant (`/^[A-Za-z0-9_-]{43}$/u`). Add strict action/start/status/intent metadata schemas. Parse untrusted unknowns before use; reject extra keys where practical. Keep validation shared only where it is actually imported by multiple functions—do not create speculative framework abstractions.

### `src/server/support-client.ts` (client service, request-response)

**Analog:** current file (single module; response bounds and HTTPS checks).

Replace `checkoutUrl`, `requestRecovery`, and `recoveryStatus` with the narrow async contract recommended by research:
```ts
type SupportAction = 'support' | 'restore';
interface HostedSupportClient {
  start(action: SupportAction, installationId: string): Promise<{ flowUrl: string } | undefined>;
  status(installationId: string): Promise<'unverified' | 'verified' | undefined>;
  close(): void;
}
```

Keep current behavior: parse configured URLs with `new URL`, require `https:`, use an injected `fetch`, abort on close, cap content-length and decoded response at 8192 bytes, parse JSON through Zod, and convert malformed/non-2xx/network responses to `undefined`. Hosted API calls carry only action and installation ID; no Supabase session/token is accepted or stored.

### `src/server/capabilities.ts` (capability, polling/request-response)

**Analog:** `createSupportCapability` at lines 148–185.

Preserve local authority and monotonic promotion:
```ts
const promote = async (remote: 'unverified' | 'verified' | undefined) => {
  if (remote === 'verified') await store.markVerified(new Date().toISOString());
  return await status();
};
```

Replace recovery fields/status (`recovery`, challenge/poll token, email) with one hosted action start operation. `startSupport`/`startRestore` should ask the client for a flow URL using the local installation ID and return unavailable when hosted service is unavailable. `refresh` remains the only path that promotes local status; never demote a locally verified installation on an unverified/network result. Keep `close()` abort semantics.

### `src/server/support-store.ts` (persistence, file I/O + CRUD)

**Analog:** current file; keep unchanged schema behavior.

Retain versioned strict JSON state with exactly installation identity, status, and optional verified timestamp. The schema invariant is `verifiedAt` iff `status === 'verified'`; installation IDs remain exact 43-character base64url. Preserve atomic temp-sibling write, fsync/rename, symlink/file checks, and compatibility with already persisted verified state. Do not add hosted session, GitHub profile, payer email, or OAuth token fields.

### `src/contracts/api.ts` (contract/validation, request-response)

**Analog:** current support schemas in the module.

Delete `SupportRecoveryRequestSchema`, `SupportRecoveryResultSchema`, and `SupportRecoveryStatusSchema` and their inferred types. Add strict local capability schemas for `{action}`/start result (`flowUrl`) and existing status/checkout-compatible responses as needed. Preserve discriminated unions and `.readonly()` conventions used throughout this contract module. This is a clean cutover: no deprecated recovery aliases.

### `src/server/routes.ts` (route/controller, request-response)

**Analog:** current support route block, lines 132–151.

Retain empty-query/body rejection and schema parsing style for status and refresh. Replace `/api/support/checkout`, `/api/support/recovery`, and `/api/support/recovery-status` with one action-start endpoint (or two explicit action endpoints only if required by the final contract) that sends the hosted flow URL; keep `/api/support/status` and `/api/support/refresh`. Follow existing `unavailable(reply, 400)` behavior for malformed requests and parse capability results before returning. Remove old routes, not aliases.

### `src/web/api/client.ts` (client API, request-response)

**Analog:** current support methods and `requestJson` helper.

Replace recovery request/status calls with an action-start call and keep status/refresh calls. Reuse bounded JSON parsing and typed Zod response validation. Treat hosted-flow URL as untrusted data from the local server: only open a validated HTTPS URL (or have the server/client boundary validate it) and never handle Supabase session credentials.

### `src/web/App.vue` (component/orchestrator, polling + request-response)

**Analog:** current support lifecycle around lines 109–143 and 956–1000.

Keep the existing status timers (2/3/5/8/10 seconds, then 15 seconds), visibility-change refresh, background 30-second refresh, abort cleanup, waiting dismissal, automatic thank-you, and workspace usability. Both Support and Restore call the hosted action start and open `flowUrl` in a new tab; the loopback workspace stays open. `refresh` polling alone transitions to verified. Remove email/recovery-pending callback paths and event handlers; no auth gate surrounds ordinary review.

### `src/web/components/SupportDialog.vue` (component, request-response/UI state)

**Analog:** current component.

Preserve Composition API, `defineProps`/`defineEmits`, focus restoration, initial focus, Tab containment, inert-background usage (owned by App), busy gating, dismiss/close, waiting, verified, and thank-you copy. Remove `email` ref, `submitRecovery` event, email input, and `recovery`/`recoveryPending` modes. The Restore action emits the same kind of hosted-flow request as Support; authentication happens in the hosted tab, not in this dialog.

### Tests

- `tests/integration/support-dialog.spec.ts`: retain Vite middleware stubs for `/api/support/status`, `/api/support/refresh`, and new action-start response; assert Support/Restore open a new hosted URL, dialog remains dismissible, visibility refresh promotes verified, and no email UI remains. Existing test establishes observable UI oracle.
- `tests/e2e/support-payment.spec.ts`: preserve optional support/no-feature-gating, new-tab hosted GitHub login before Checkout, cancellation/delay, signed webhook then polling/thank-you, and workspace remains usable. Use real hosted development evidence for provider acceptance; local mocks only for deterministic UI behavior.
- `tests/e2e/support-recovery.spec.ts`: rename conceptually to support-restore/OAuth; assert same GitHub account can restore on a second installation and non-supporter gets generic completion/unverified status. Delete email/magic-link assertions.
- `supabase/functions/**/tests`: use existing `services/support/tests/fulfillment.test.ts` structure (Vitest fakes for Stripe retrieval and in-memory event/session/binding state) for pure classification/idempotency; add database-only integration for constraints, intent expiry/one-use, RLS denial, concurrent webhook settlement, paid/unpaid restore, and migration reset/replay.

## Shared Patterns

### Hosted trust boundary
**Sources:** `src/server/support-client.ts`, `src/server/routes.ts:132–151`, `services/support/src/routes/installations.ts`.  
All local-to-hosted calls are narrow HTTPS capability calls with bounded bodies and strict schemas. The loopback server owns local state; hosted responses can only promote it after status polling. Anonymous status returns a boolean-style result for one high-entropy installation ID and never exposes account/supporter lookup.

### Payment authority and idempotency
**Sources:** `services/support/src/routes/stripe-webhook.ts:10–35`, `services/support/src/fulfillment.ts`.  
Read raw webhook body, verify Stripe signature, filter event type, retrieve authoritative session, validate exact product/payment invariants, then settle via one transaction. Unique event/session/installation constraints—not preflight reads—provide replay/concurrency safety. Browser redirects never establish authority.

### Validation and errors
**Sources:** `services/support/src/schema.ts`, `src/contracts/api.ts`, `src/server/routes.ts`.  
Strict Zod schemas at trust boundaries; reject malformed/extra data; generic externally visible errors; bounded responses. Keep transient webhook failures distinguishable from invalid requests for retry behavior.

### Local persistence compatibility
**Source:** `src/server/support-store.ts`.  
Versioned JSON, atomic replacement, verified-state monotonicity, installation ID only. Existing machine-wide verified files remain valid after package upgrade.

### OAuth/session privacy
**No direct analog; use research contract.** Supabase Auth owns GitHub OAuth session and PKCE cookies on hosted flow only. Validate callback user server-side. Never send auth code/tokens through Cumpa or store profile/email/token locally.

### Supabase deployment
**No analog; use research contract.** Version `supabase/config.toml`, migrations, and Edge Functions in Git. Development and production are separate projects; production CI applies migrations before functions on protected `main`. Remove Render/Fastify/pg/Resend artifacts only after hosted proof; do not build dual-write/import/fallback compatibility.

## No Analog Found

| File/surface | Role | Data Flow | Why no analog |
|---|---|---|---|
| `supabase/config.toml` | platform config | deployment | Repo has only Render config; Supabase per-function JWT settings are new. |
| `supabase/functions/support-flow/index.ts` OAuth internals | auth provider flow | redirect/session | Existing recovery is email challenge, not OAuth/PKCE/cookie session. |
| `supabase/migrations` RLS/security-definer RPCs | database authority | transactional CRUD | Legacy SQL lacks Supabase `auth.users`, RLS, and function grants. |
| `.github/workflows/<supabase-deploy>.yml` | CI deployment | batch | No existing hosted migration/function CI analog identified. |
| Hosted support completion page/redirect | hosted UI | redirect | No hosted browser surface exists; avoid rich Edge HTML unless custom domain is provisioned. |
| Real hosted development evidence | acceptance/runbook | event-driven/request-response | Existing tests are local/provider-mocked; D-17 requires actual Supabase/GitHub/Stripe proof. |
| Supabase Auth provider/project setup | infrastructure | configuration | Project resources are not represented in source today; document exact dev/prod settings. |
| `services/support/src/recovery.ts`, `recovery-store.ts`, `email.ts` replacement | deleted legacy surface | email request/event | Deliberately removed, not adapted; no compatibility aliases. |

## Deletion and Cutover Conventions

Delete `services/support/src/app.ts`, `server.ts`, `db.ts`, `config.ts`, recovery/email modules, all legacy Fastify routes, legacy service package/config/tests/migrations, `render.yaml`, and obsolete Render/Resend/Postgres/payment-link environment names after Supabase hosted development proof. Update package boundaries and packed-artifact checks so deleted service files and privileged Supabase/GitHub/Stripe secrets cannot ship. Do not import Fastify into the new functions, retain a compatibility endpoint, dual-write old tables, or build a Render fallback. Keep only the local `support-store` state migration/compatibility needed for already verified installations.

## Metadata

**Analog search scope:** `src/server`, `src/contracts`, `src/web`, `services/support/src`, `services/support/tests`, `tests/integration`, `tests/e2e`, root deployment/docs/scripts.  
**Pattern extraction date:** 2026-08-14
