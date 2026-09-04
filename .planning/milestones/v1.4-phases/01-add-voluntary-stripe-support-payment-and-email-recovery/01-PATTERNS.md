# Phase 01: Voluntary Stripe Support Payment and Email Recovery — Pattern Map

**Mapped:** 2026-08-12  
**Files analyzed:** 16 likely application/test/config areas (including hosted deployable)  
**Analogs found:** 14 / 16 (hosted service and package-safety coverage have no existing Cumpa analog)

## File Classification

| New/Modified File | Role | Data flow | Closest analog | Match |
|---|---|---|---|---|
| `src/contracts/api.ts` | shared contract | request-response | same file (draft/session schemas) | exact |
| `src/server/support-store.ts` | persistence/store | file I/O, CRUD | `src/server/draft-store.ts` | exact mechanics |
| `src/server/support-client.ts` | outbound service | request-response | `src/web/api/client.ts` (validated fetch) | role-match |
| `src/server/capabilities.ts` | capability/service | request-response | existing capability registry methods | exact architecture |
| `src/server/app.ts` | composition/config | request-response | existing app factories | exact |
| `src/server/routes.ts` | authenticated routes | request-response | `/api/patch-status`, attached routes | exact |
| `src/server/security.ts` | middleware/security | request-response | existing hook | exact (do not weaken) |
| `src/cli/run.ts` | CLI wiring | startup/request-response | `createLaunchRuntime` | exact |
| `src/web/api/client.ts` | browser client | request-response | existing `requestJson` | exact |
| `src/web/App.vue` | orchestration/store | event-driven/polling | patch-status lifecycle | exact |
| `src/web/components/SupportDialog.vue` | component/modal | event-driven | `IdentityPanel.vue` | role + accessibility |
| `src/web/components/IdentityHeader.vue` (or adjacent menu component) | app-menu trigger | event-driven | identity disclosure | role-match |
| `services/support/*` | hosted service | webhook/event-driven, CRUD, email I/O | **none** | none |
| `tests/api/*support*.test.ts` | Vitest integration | request-response/file I/O | `tests/api/draft*.test.ts`, `security.test.ts` | exact test style |
| `tests/e2e/*support*.spec.ts` | Playwright E2E | browser event-driven | **no existing Playwright support analog found**; use project E2E conventions if present | partial |
| `tests/package/package-assets.spec.ts` and package safety tests | package test | batch/artifact inspection | **none found** | none |

## Pattern Assignments

### Contracts: `src/contracts/api.ts`

**Analog:** existing strict schemas in `src/contracts/api.ts` (imports at lines 1–15; `DraftMutationRequestSchema`, `DraftLoadResponseSchema`, `ApiErrorSchema`; inferred types near file end).

Copy the convention: `z.strictObject(...).readonly()`, discriminated unions for result kinds, schema parse at server boundaries, and exported inferred types. Keep support status deliberately presentation-only and do not add it to capability authorization. Support route requests should have strict empty query/body semantics matching `src/server/routes.ts`.

**Adaptation:** add schemas for `{status}`, checkout `{kind,url}`, refresh, recovery accepted/poll state. Never include email, installation ID, Stripe IDs, or poll secrets in local response/state DTOs.

### Local machine-wide persistence: `src/server/support-store.ts`

**Analog:** `src/server/draft-store.ts:157-194` (`commit`). Concrete sequence:

```ts
const bytes = Buffer.from(`${JSON.stringify(ReviewDraftV1Schema.parse(draft))}\n`, 'utf8');
const temporaryPath = join(directory, `.${key}.${randomUUID()}.tmp`);
handle = await fileSystem.open(temporaryPath, 'wx', 0o600);
await handle.writeFile(bytes);
await handle.sync();
await handle.close();
await fileSystem.rename(temporaryPath, canonicalPath);
try { await fileSystem.syncDirectory(dirname(canonicalPath)); } catch (error) {
  if (!isUnsupportedDirectorySync(error)) throw error;
}
```

Preserve failure cleanup: canonical bytes are untouched until rename; unlink only the temporary path on pre-rename failure; throw a bounded persistence error. Reuse the injected filesystem seam and atomic replacement tests from `tests/api/draft-atomicity.test.ts` (lines 89–122). Adapt root resolution to one user-level platform path, never `repositoryRoot/.cumpa`, and validate a strict versioned support schema before read/write. Corrupt/newer/unreadable data must fail closed to unverified; do not silently claim verified. A local verified state must not be downgraded by hosted outage.

### Hosted outbound client: `src/server/support-client.ts`

**Analog:** `src/web/api/client.ts:87-143`, especially `requestJson`: derives session token once, sends `authorization: Bearer`, `cache: 'no-store'`, `referrerPolicy: 'no-referrer'`, catches network errors, rejects non-OK responses, then validates response schemas. Reuse native `fetch`, bounded timeout/AbortController, and Zod parsing. This server client uses configured HTTPS hosted base URL and public installation reference only; it must never log email/tokens or contain secrets. There is no local Stripe SDK pattern; Stripe belongs only in hosted service.

### Capability and app composition: `src/server/capabilities.ts`, `src/server/app.ts`

**Analogs:** `src/server/app.ts:101-144` and capability registry construction. Existing factory pattern creates a registry, registers security, registers routes, then static assets:

```ts
const capabilities = createCapabilityRegistry(comparison, { ...options, draftStore });
const security = registerSessionSecurity(app, options);
app.decorate('bindSessionSecurity', security.bind);
registerSessionRoutes(app, capabilities);
void app.register(fastifyStatic, { root: webRoot, index: ['index.html'] });
```

Add a narrow support capability dependency and pass the same machine store/client through ordinary, range, and exact-patch constructors. Keep support methods separate from review authorization/capability checks. `src/server/app.ts` must construct/inject one support store per launch, not per repository.

### Authenticated routes: `src/server/routes.ts`, `src/server/security.ts`

**Analog:** `src/server/routes.ts:119-160` (`GET /api/session`, attached status/finish) and patch-status route. Routes use `EMPTY_QUERY_SCHEMA`, reject unexpected body/content-type/content-length, apply small `bodyLimit`, `safeParse` request body, parse output schema, and map bounded failures via `unavailable(reply, status)`.

```ts
app.get('/api/session', { schema: { querystring: EMPTY_QUERY_SCHEMA } }, async () => await capabilities.session());
const input = FinishReviewRequestSchema.safeParse(request.body);
if (!input.success) return unavailable(reply, 400);
return FinishReviewResultSchema.parse(await capabilities.attachedCompletion!.status());
```

`src/server/security.ts:72-112` is the inherited Host/Origin/Bearer hook; preserve it for every `/api/support/*` route. Existing `tests/api/security.test.ts:132-242` proves missing/wrong bearer, host/origin, bind-time loopback authority, and bounded diagnostics. Add support routes to the same registration/security boundary; do not expose direct browser-to-hosted calls.

### CLI wiring: `src/cli/run.ts`

**Analog:** `src/cli/run.ts:220-264`: generate `randomBytes(32).toString('base64url')` session token, call `createSessionApp`, listen on `{host:'127.0.0.1',port:0}`, validate actual address, bind security with exact authority, then open browser. Resolve support store once before app construction and inject it into every launch variant. Checkout tab opening belongs to browser `window.open` in the UI, not CLI's startup opener.

### Browser API: `src/web/api/client.ts`

**Analog:** `createSessionClient` and its frozen return object. Add methods that call the existing `requestJson` wrapper, validate input/output with imported schemas, and classify failures without turning cancellation/outage into “payment failed.” Keep `credentials:'same-origin'`, no-store, no-referrer, Bearer token, and fragment token removal unchanged.

### Root Vue orchestration and polling: `src/web/App.vue`

**Analog:** `src/web/App.vue:903-915`:

```ts
async function refreshPatchStatus(): Promise<void> {
  if (sessionClient === undefined || patchStatusRefreshing || patchStatus.value?.kind === 'snapshotUnavailable') return;
  patchStatusRefreshing = true;
  try { patchStatus.value = await sessionClient.getPatchStatus(); }
  finally { patchStatusRefreshing = false; }
}
function startPatchStatus(): void {
  void refreshPatchStatus();
  document.addEventListener('visibilitychange', refreshPatchStatusWhenVisible);
  patchStatusInterval = window.setInterval(refreshPatchStatusWhenVisible, 30_000);
}
function stopPatchStatus(): void { /* remove listener, clear interval */ }
```

Use the same in-flight guard, visibility refresh, timer teardown, and `onMounted`/`onBeforeUnmount` lifecycle. Start support prompt only after session/workspace initialization succeeds and only once per process. Keep `dismissedForSession` in memory. Continue low-rate refresh after dialog close so late webhook fulfillment persists. Dialog background uses existing `:inert="identityOpen && identityModal"` pattern (template around lines 1000–1028).

### Modal component: `src/web/components/SupportDialog.vue`

**Analog:** `src/web/components/IdentityPanel.vue:1-72,76-206`. Imports `ref`, exposes `focusClose`, uses labelled dialog attributes and a Tab trap:

```ts
const closeButton = ref<HTMLButtonElement>();
function focusClose(): void { closeButton.value?.focus(); }
function containFocus(event: KeyboardEvent): void {
  if (!props.modal || event.key !== 'Tab') return;
  const controls = Array.from((event.currentTarget as HTMLElement)
    .querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  if (controls.length === 0) return;
  const first = controls[0]!; const last = controls.at(-1)!;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
```

Template uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, explicit close button, and `@keydown`. App opens with `nextTick(() => panel.focusClose())`, closes with `nextTick` focus restoration (`App.vue:805-827`), and marks workspace inert. Adapt to invitation/waiting/recovery/thank-you states; no “I’ve paid” action and no persistent badge.

### App-menu integration: `src/web/components/IdentityHeader.vue`

**Analog:** `IdentityHeader.vue:1-80`: computed display facts, `defineEmits`, button ref, `defineExpose({ focusDisclosure })`, accessible `aria-controls`/`aria-expanded`, and a quiet disclosure button. Add a quiet Support Cumpa trigger/menu adjacent to existing header facts or a small app-menu component; keep supporter status out of persistent workspace facts. Reuse `App.vue` Escape handling and focus restoration conventions.

### Hosted service: `services/support/*`

**No analog exists.** No hosted deployment, webhook, relational store, email provider, or Stripe code is present in this repository. Planner must establish a separate deployable boundary. It owns raw-body Stripe signature verification before parsing, server-side Session/line-item retrieval, exact live/mode/payment/Price/USD/4999/quantity checks, idempotent transactional entitlement/binding, HMAC email lookup, rate-limited generic recovery responses, hashed single-use installation-bound tokens, and email delivery. No hosted source/secrets may enter Cumpa package. Do not copy a local route or invent a second in-package convention.

### Vitest local/API tests: `tests/api/*support*.test.ts`

**Analogs:** `tests/api/draft-atomicity.test.ts:89-122`, `draft-lifecycle.test.ts:69-110`, `security.test.ts:132-242`, and `attached-completion.test.ts:87-160`. Tests build Fastify apps and use `app.inject`, deterministic temp roots, `vi.fn`, and table-driven invalid requests. Add observable contract tests for strict schemas, all security denials, atomic fault boundaries, verified/outage promotion semantics, and all three app constructors. Do not test implementation text.

### Playwright: `tests/e2e/*support*.spec.ts`

**Analog:** No support-specific Playwright analog was found in the inspected tree. Use any existing project E2E harness/config if discovered during planning; otherwise research-defined checks are the source pattern: real workspace-visible prompt, second-tab Checkout handoff, dismissal/session behavior, waiting/late verification, recovery, menu opening, focus trap/inert background, and automatic thank-you close. Stub hosted calls through injected fake client/public URL rather than secrets.

### Package safety tests

**No analog exists.** Research proposes `tests/package/package-assets.spec.ts` and package safety checks, but no existing artifact/secrets scan pattern was found. Planner should use the repository's test runner and `npm pack --dry-run`/tar inspection convention if one is added; assert hosted source, env files, database config, provider credentials, and `sk_live_`, `rk_live_`, `whsec_` patterns are absent.

## Shared Patterns

- **Security boundary:** all local API requests inherit exact Host, Origin, Bearer token, loopback bind, `cache-control: no-store`, and `no-referrer` behavior from `src/server/security.ts` and `src/web/api/client.ts`.
- **Strict validation:** schemas are strict/read-only; parse inputs and outputs at boundaries. Invalid/corrupt/newer persisted state fails explicitly or fails closed.
- **Atomic persistence:** temp sibling (`wx`, `0600`) → write → fsync → close → rename → parent sync; cleanup never touches canonical bytes before successful rename.
- **Server authority:** browser owns transient modal/dismissal state; server/store owns durable installation status; payment proof exists only in hosted verified fulfillment.
- **Lifecycle cleanup:** every listener, interval, AbortController, and in-flight guard is stopped/cleared on unmount or app shutdown.
- **No feature gating:** support status must not enter review capability authorization or alter review/export behavior.

## No Analog Found

| Area | Reason |
|---|---|
| `services/support/*` | Repository has no hosted service, Stripe webhook, database transaction, or email delivery implementation. |
| Package artifact/secrets tests | No existing package safety test or hosted-source exclusion convention found. |
| Support-specific Playwright flow | No matching E2E support flow found; use existing harness if present and requirements as behavioral source. |

## Metadata

**Analog search scope:** `src/contracts`, `src/server`, `src/cli`, `src/web`, `tests/api`, `tests/e2e`, `tests/package`, package configuration.  
**Files scanned closely:** `src/contracts/api.ts`, `src/server/app.ts`, `capabilities.ts`, `routes.ts`, `security.ts`, `draft-store.ts`, `src/cli/run.ts`, `src/web/api/client.ts`, `App.vue`, `IdentityPanel.vue`, `IdentityHeader.vue`, representative API tests.  
**Pattern extraction date:** 2026-08-12
