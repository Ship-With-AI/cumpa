---
phase: quick
plan: 260913-dzc
type: execute
mode: quick
autonomous: true
files_modified:
  - scripts/verify-supabase-support.mjs
  - tests/e2e/support-payment.spec.ts
  - .github/workflows/deploy-supabase-production.yml
---

# The live deploy gate must verify stability, not emptiness

## Defect 1 — the production deploy gate can never pass again

`.github/workflows/deploy-supabase-production.yml:71` runs `node scripts/verify-supabase-support.mjs --run-deployment --mode production-live --evidence supabase-deployment-evidence.json`. With `SUPPORT_PROVIDER_MODE=production-live`, `deploy()` (`scripts/verify-supabase-support.mjs:695-698`) dispatches to `deployLive()` (913-928):

```
913 async function deployLive(inputs, evidencePath) {
914   const before = await snapshotAuthority(inputs);
915   assertManifest(before, true);              // <- requires ALL SIX tables empty
916   const coherence = await verifyLiveCoherence(inputs);
917   const order = await applyHostedConfiguration(inputs);
918   const routes = await probeRoutes(inputs.routes);
919   const liveSmoke = await probeLiveStatus(inputs);
920   const authority = await snapshotAuthority(inputs);
921   assertManifest(authority, true);           // <- requires empty again
922   if (JSON.stringify(before) !== JSON.stringify(authority)) fail('live deployment changed authority rows');
```

`TABLES` (13-20) covers `auth.users`, `support_private.support_intents`, `support_private.supporters`, `support_private.checkout_sessions`, `support_private.stripe_events`, `support_private.installation_bindings`. `assertManifest(..., true)` fails at line 1056 with `evidence authority is not zero` as soon as any of those has a row.

The operator's real GitHub sign-in during Phase 7 acceptance created at least an `auth.users` row and a `support_private.support_intents` row in the production project. Today's push therefore ended in `supabase support verifier rejected: evidence authority is not zero` after every repository gate had passed. The zero-row requirement encodes a pre-launch assumption — a pristine database — that a live service with real users has permanently outgrown, so **every** future production deploy is blocked by it.

The load-bearing property is line 922: a live deploy must not mutate authority rows. On a populated database that is strictly stronger evidence than "the database is empty" — an empty database cannot be mutated in a way the manifest would notice, a populated one can.

## Defect 2 — a stale spec reference hides what the gate actually runs

`tests/e2e/support-recovery.spec.ts` was retired in `222d920` ("Retire the stale recovery-named E2E suite after destination verification"); its assertions were moved into `support-payment.spec.ts` and `support-restore.spec.ts`. The filename still appears in three live places, so the gate advertises coverage that does not exist (Playwright silently ignores the missing path — `--list` exits 0 reporting "12 tests in 2 files"). This is already the tracked debt item TD-1 (`.planning/MILESTONES.md:31`, `.planning/milestones/v1.4-MILESTONE-AUDIT.md:17,89`), which names exactly these three files.

## Decisions

**D-01 — Drop the zero requirement in the live deployment path only; keep everything else in that path.**
Delete lines 915 and 921. Nothing else in `deployLive` changes. Structural validation is *not* lost by doing this: `snapshotAuthority` → `manifestForRows` (798-808) already ends with `assertManifest(manifest)` at line 806, so both snapshots still go through the full count/handles/uniqueness/cross-table-collision/hash/sortedness checks (1041-1055). What disappears is only the `requireZero && entry.count !== 0` branch at 1056. Line 922 becomes the sole authority gate for a live deploy, and it still fails closed on any mutation.

**D-02 — The converted test simulates a changing authority with a call counter in the fetch hook.**
`deployLive` issues exactly two `/database/query` requests (the before snapshot at 914 and the after snapshot at 920), in that order, and no other code path in the live run touches `/database/query`. The hook at `tests/e2e/support-payment.spec.ts:147-166` is a module evaluated once per verifier process, so a module-scoped counter distinguishes them deterministically:

```js
let authorityCalls = 0;
// ...
if (url.includes('/database/query')) {
  authorityCalls += 1;
  const populated = process.env.POPULATED === 'true'
    || (process.env.CHANGED === 'true' && authorityCalls > 1);
  return new Response(JSON.stringify(populated
    ? [{ table_name: 'auth.users', id: '11111111-1111-4111-8111-111111111111' }]
    : []));
}
```

- no env flag → both snapshots `[]` (today's zero-row happy path, unchanged);
- `POPULATED=true` → both snapshots return the same single row, so `before` and `authority` are identical and the deploy is **accepted**;
- `CHANGED=true` → first snapshot `[]`, second snapshot one row, so the manifests differ and the deploy is **rejected** with `live deployment changed authority rows`.

The existing `NONZERO` flag and its `evidence authority is not zero` expectation are replaced by these two cases; the flag name goes away with the property it tested. That message string keeps independent coverage in `tests/e2e/support-restore.spec.ts:326-329`, where a non-zero `authority_confirmation` in a cleanup record must still be rejected — so converting this case does not orphan the assertion.

**D-03 — Remove the stale spec path from all four live references in one commit.**
`.github/workflows/deploy-supabase-production.yml:29` is pinned verbatim in three places inside `verifyWorkflow` (`scripts/verify-supabase-support.mjs:1735` in the `required` list, `:1740` in the `commands` set loop, `:1749` in the `gateCommands` loop) and asserted by the mutation row at `tests/e2e/support-payment.spec.ts:213`. Changing the workflow alone would make the verifier reject the repository's own workflow; changing the verifier alone would make the workflow fail its own gate. All four edits are one commit. The mutation row's *replacement* string (`'npx playwright test tests/e2e/support-payment.spec.ts'`) stays valid after the change — it still drops `support-restore.spec.ts`, so it is still a genuine regression — only the row's `expected` string needs the two-path form.

**D-04 — No `.planning` archive edits.**
`.planning/MILESTONES.md`, `.planning/milestones/v1.4-*`, and the Phase 02/07 plans and summaries record what was true at ship time, including TD-1 as retained debt and the pre-launch zero-authority evidence. They stay byte-identical; this task's SUMMARY records that TD-1 is now closed.

## Inventory — every `assertManifest(..., true)` callsite, classified

This is the core of the task. A wrong classification here silently weakens release or cleanup evidence.

| # | Line | Callsite | Argument | Verdict | Justification |
|---|------|----------|----------|---------|---------------|
| 1 | 480 | `checkReleaseEvidence`, under `--require-zero-authority` | `release.record.authority_before` | **KEEP ZERO** | Release lineage. Validates the archived one-time v1.4 release record, whose live run genuinely happened against a pristine project. Flag-gated, never reached by `--run-deployment`. |
| 2 | 481 | `checkReleaseEvidence`, under `--require-zero-authority` | `release.record.authority_after` | **KEEP ZERO** | Same record, after side. Dropping it would let a later release attestation claim pre-launch purity it does not have. |
| 3 | 855 | `exactCleanup`, post-delete snapshot | `authority` | **KEEP ZERO** | Prelaunch-only path (`deploy()` refuses `--acceptance` in live mode at 692). The entire point of exact cleanup is proving the fixture rows are gone; zero *is* the contract. |
| 4 | 858 | `exactCleanup`, confirmation snapshot after route probes | `confirmation` | **KEEP ZERO** | Proves the probes did not resurrect rows. Same prelaunch-only path. |
| 5 | **915** | **`deployLive`, before snapshot** | **`before`** | **DROP ZERO** | The only site that gates a recurring production deploy on a pre-launch assumption. Structural validation survives via `manifestForRows`:806; stability survives via 922. |
| 6 | **921** | **`deployLive`, after snapshot** | **`authority`** | **DROP ZERO** | Same run, after side. Keeping it would re-block the gate one line below the equality check that actually carries the invariant. |
| 7 | 1090 | `validateRun`, under `--require-zero-authority` | `record.authority` | **KEEP ZERO** | Flag-gated evidence *reader*, not a deploy path. Its callers are `validateAcceptance:1146` (prelaunch deployment run), `validatePromotion:1222` (prelaunch cleanup run), `validatePromotion:1226` (the archived live run), and the `--check-run-evidence` CLI. All inspect recorded pre-launch artifacts. |
| 8 | 1096 | `validateRun`, exact-cleanup branch | `record.authority_confirmation` | **KEEP ZERO** | Reader-side mirror of #4; the cleanup contract in evidence form. Independently covered by `support-restore.spec.ts:326-329`. |
| 9 | 1228 | `validatePromotion` | `record.live.authority_before` | **KEEP ZERO** | Promotion lineage for the one-time launch: the promoted live run must be the one that ran against an empty project. Not a deploy gate. |

Structural-only callsites (`requireZero` absent/false) — untouched, listed so the inventory is exhaustive: `806` (`manifestForRows`, every snapshot in the process), `1094` (`record.authority_before`), `1095` (`record.deleted`), `1118`/`1119` (hostile matrix before/after), `1158` (`record.fixture_manifest` in `validateAcceptance`), `1174` (`deploymentRun.fixture_manifest` in `mergeAcceptanceEvidence`). Sixteen callsites in total, nine of them with `requireZero`.

Net change: **2 of 9** `requireZero` sites drop, both inside `deployLive`. No `--require-zero-authority` flag handling, prelaunch path, cleanup path, or promotion/release lineage check is edited.

## Evidence redaction — non-zero manifests with hashed handles are already permitted

Verified from source, not assumed. After D-01 the uploaded `supabase-deployment-evidence.json` carries non-zero `authority` and `authority_before` manifests, and `writeEvidence:967` refuses to write any record for which `evidenceContainsProtectedValue` (955-964) is true. It stays false for a populated manifest:

- **Keys.** `RAW_VALUE_KEY` (62) matches only `access_token|secret|password|project_ref|client_id|oauth|email|provider|token` delimited by `^`/`_`/`$`. The manifest keys are the six table names plus `count` and `handles`; none match. Array entries are recurred with `key = ''` (961).
- **Values.** `count` is a number → falls through to `return false` (963). Each handle is `sha256(`${table}:${id}`)` (`manifestForRows`:803) and `assertManifest` enforces `isHash` → `/^[a-f0-9]{64}$/` (1052, 92-94). A 64-char lowercase-hex string cannot contain `.supabase.co`, `@`, or any alternative of `/(sk_|whsec_|gh[ops]_|price_|we_|oauth|email|token|code=|state=|profile)/iu` (959) — every one of those needs a character outside `[a-f0-9]`. Raw row ids never reach the record.
- **Precedent in the same file.** `exactCleanup` already writes non-zero `authority_before` and `deleted` manifests (861-862) through `writeRunEvidence` → `writeEvidence`, and that path is green today. Populated manifests in evidence are an established, exercised shape.
- **Checked concretely for the test fixture.** `sha256('auth.users:11111111-1111-4111-8111-111111111111')` = `9317cda8475d7e5e86cbb81799df2022ff58922a3cc8c17ebbc2e09f82af06dc` — no `@`, no protected-token match, and no 20-character run of `a` that could collide with the test's `projectRef` (`'a'.repeat(20)`). The `POPULATED` case will pass the guard.

So the evidence record gains row *counts* and *hashed* handles, and no raw identifier, email, token, origin, or project ref. The redaction guard needs no change and must not be relaxed.

## Must NOT change

- `assertManifest`'s structural validation (1041-1055): completeness, `count` integrality and non-negativity, `handles` array shape, `count === handles.length`, intra-table uniqueness, cross-table handle collision, `isHash`, sortedness. Only the `requireZero` branch is bypassed, and only by not passing `true` at two callsites.
- The `requireZero` mechanism itself — the parameter, line 1056, and the `--require-zero-authority` flag declarations (148, 153, 173) all stay.
- Inventory rows 1, 2, 3, 4, 7, 8, 9 above: prelaunch, exact-cleanup, and promotion/release lineage keep their zero requirements verbatim.
- `verifyLiveCoherence` (872-898) — live Stripe secret-mode/webhook-secret prefix checks and the price/endpoint object, active, livemode, currency, `4999`, `one_time`, status, url, and enabled-events assertions.
- `probeLiveStatus` (900-911) and `probeRoutes` (930-945) — the non-destructive smoke and the four route-probe contracts, including the exact `{"status":"unverified"}` body.
- `deployLive` line 922 and its message `live deployment changed authority rows`; `applyHostedConfiguration`'s mutation order; `guardTarget`/`guardedMutation`; `deploymentRecord`/`writeRunEvidence`/`immutableRunContext`; `evidenceContainsProtectedValue`/`evidencePolicy`/`writeEvidence`.
- **Production data.** No `INSERT`, `UPDATE`, `DELETE`, purge, or migration. No `supabase` CLI invocation, no Management API call, no live deploy, no dispatch, no sign-in, no payment, no provider or Stripe configuration change. The verifier is only ever run in this task through the Playwright specs, which stub `globalThis.fetch`.
- `supabase/migrations/**`, `supabase/functions/**`, `src/**`, `.planning/phases/07-*`, and every `.planning` archive (D-04). Untracked `.gsd/`, `EVIDENCE.md`, `mockups/` are operator-owned.
- The other two spec paths in the workflow gate (`support-payment.spec.ts`, `support-restore.spec.ts`) and every other pinned command, ordering, guard, and upload assertion in `verifyWorkflow`.
- No existing assertion may be weakened, deleted, or retargeted to make anything pass — the retired zero case is *converted* into the two cases in D-02, not dropped.

## Tasks

### Task 1 — Live deploy verifies authority stability instead of emptiness

**Files:** `scripts/verify-supabase-support.mjs`, `tests/e2e/support-payment.spec.ts`

Both files move in one commit: the verifier change makes the existing `NONZERO` expectation false, and the test change makes no sense without the verifier change. Splitting them would leave `main` with a red suite between two commits.

**Action:**
1. `scripts/verify-supabase-support.mjs`: delete line 915 (`assertManifest(before, true);`) and line 921 (`assertManifest(authority, true);`). Change nothing else in `deployLive` — `before`, `coherence`, `order`, `routes`, `liveSmoke`, `authority`, the equality check at 922, and the record assembly at 923-927 all stay. Do not touch `assertManifest`, and do not add a mode flag, parameter, or option: the live path simply stops asserting emptiness.
2. `tests/e2e/support-payment.spec.ts`: rename the test at line 137 to state the new contract — `test('live deployment accepts unchanged populated authority and rejects changed authority', ...)`.
3. In that test's fetch hook, replace the `NONZERO` branch of the `/database/query` handler with the counter form in D-02 (`let authorityCalls = 0;` at hook top level; `POPULATED` returns the row on both calls, `CHANGED` returns `[]` first and the row second). Leave every other branch of the hook (Stripe price, webhook endpoint with `BAD_ENDPOINT`, `/config/auth`, `/secrets`, `/auth/v1/settings`, `/support-api/status?`, `/support-api`, `/support-flow`, `/stripe-webhook`, and the trailing `throw`) exactly as it is.
4. Keep the zero-row happy path (189-194) unchanged: run with plain `environment`, expect resolution, and assert the evidence still matches `mode: 'production-live'`, `coherence: { status: 'passed' }`, `live_smoke: { status: 'passed', non_destructive: true }`.
5. Add the accepted-populated case: run with `{ ...environment, POPULATED: 'true' }`, expect it to **resolve**, and assert the written evidence matches `coherence: { status: 'passed' }`, `live_smoke: { status: 'passed', non_destructive: true }`, and `authority: { 'auth.users': { count: 1 } }` — the count proves the run really saw a populated authority rather than silently reading zero rows.
6. Replace the `NONZERO` rejection (195-197) with the changed-authority case: run with `{ ...environment, CHANGED: 'true' }` and expect rejection with stderr containing `live deployment changed authority rows`.
7. Leave the `BAD_ENDPOINT` case (198-200) and its `live Stripe coherence failed: endpoint-events` expectation untouched.

**Verify:** `npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts`

**Done:** Both specs pass with no skips. The populated-but-unchanged run exits 0 and writes evidence recording `authority['auth.users'].count === 1` alongside passed coherence and a non-destructive smoke; the changed-authority run exits non-zero with `live deployment changed authority rows`; the zero-row and `BAD_ENDPOINT` cases still behave exactly as before. `grep -n 'assertManifest(.*, true)' scripts/verify-supabase-support.mjs` lists exactly seven lines — 480, 481, 855, 858, 1090, 1096, 1228 — and none inside `deployLive`. `tests/e2e/support-restore.spec.ts` is unmodified and still proves `evidence authority is not zero` for cleanup confirmation.

**Commit:** `fix(quick-260913-dzc): verify live deploy authority stability instead of emptiness`

### Task 2 — The deploy gate names only the specs it runs

**Files:** `.github/workflows/deploy-supabase-production.yml`, `scripts/verify-supabase-support.mjs`, `tests/e2e/support-payment.spec.ts`

All three in one commit; the workflow and its verifier contract are mutually pinned (D-03).

**Action:**
1. `.github/workflows/deploy-supabase-production.yml:29`: remove ` tests/e2e/support-recovery.spec.ts`, leaving `- run: npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts`. Change no other line — step order, the `npx vitest` step before it, and the `deno test` step after it stay put, because `verifyWorkflow`'s `testOrder` and `order` checks depend on them.
2. `scripts/verify-supabase-support.mjs`: drop the same path from the pinned Playwright command in all three occurrences — the `required` array (1735), the `commands` loop (1740), and the `gateCommands` loop (1749). Each becomes `'npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts'`. Touch nothing else in `verifyWorkflow`.
3. `tests/e2e/support-payment.spec.ts:213`: update only the `expected` field of the `'playwright'` mutation row to the two-path command. Keep the replacement `'npx playwright test tests/e2e/support-payment.spec.ts'` and the expected message `'workflow is missing required'` — dropping `support-restore.spec.ts` is still a real regression, so the row still proves the gate rejects a narrowed suite.

**Verify:** `node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml && npx playwright test tests/e2e/support-payment.spec.ts`

**Done:** The verifier accepts the repository's own workflow (exit 0, no output) and the payment spec passes, including the workflow-mutation test. `grep -rn 'support-recovery' .github scripts tests src` returns nothing. The workflow still names `support-payment.spec.ts` and `support-restore.spec.ts`, and `npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts --list` reports the same two files it does today. TD-1 (`.planning/MILESTONES.md:31`) is satisfied without editing any archive.

**Commit:** `chore(quick-260913-dzc): drop the retired recovery spec from the deploy gate`

## Verification

Run from the repository root after both tasks:

1. `npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts` — the converted live-deploy contract plus the untouched cleanup, promotion, and release evidence contracts.
2. `node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml` — the workflow gate accepts its own workflow.
3. `grep -c 'assertManifest' scripts/verify-supabase-support.mjs` → **15** (14 callsites plus the definition at 1040; 17 before the change), and `grep -n 'assertManifest(.*, true)' scripts/verify-supabase-support.mjs` → **7** lines, at 480, 481, 855, 858, 1090, 1096, 1228.
4. `git status --short` (clean apart from the operator-owned untracked paths) and `git show --stat HEAD~1 HEAD` — the two commits together touch exactly the three files in `files_modified`, plus this task's own quick directory and the STATE.md row. No `supabase/`, `src/`, `.planning/phases/`, or `.planning/milestones/` change.

Do **not** run: `--run-deployment` in any mode, any `supabase` CLI command, any live acceptance flow, or the production workflow. Nothing in this verification list contacts a network endpoint that is not stubbed by the specs.

## Operational consequence — stated plainly

- After this change a production deploy becomes **possible** again. Nothing deploys as a result of merging it: `deploy-supabase-production.yml` triggers only on `push` to `main` (there is no `workflow_dispatch`, and `verifyWorkflow` forbids adding one), so the next push runs the gate, and this task performs no push.
- The next successful live run will record non-zero `authority` and `authority_before` manifests in the uploaded `supabase-deployment-evidence.json` — row counts plus hashed handles, no raw identifiers. That shape passes the redaction guard for the reasons established from source above.
- A live deploy that mutates any authority row still fails, with `live deployment changed authority rows`. That is now the only authority gate on the live path, and it is the one that matters on a populated database.
- The one-time launch attestation stays pinned to pre-launch purity: `--check-promotion-evidence` and `--check-release-evidence` with `--require-zero-authority` still demand zero rows in the *archived* v1.4 live run (inventory rows 1, 2, 7, 9). No workflow invokes those flags — grep across `.github/workflows` and `package.json` finds none — they were run by hand for the launch lineage. Consequence: a *new* promotion or release built from a post-launch live run would fail those assertions and would need its own decision. That is out of scope here, and deliberately so: the recurring deploy gate is unblocked without rewriting the launch record.
- Production data is untouched by this task and by every future run of the changed path — `deployLive` only ever reads authority rows, with `read_only: true` (`authorityRows`:786).
