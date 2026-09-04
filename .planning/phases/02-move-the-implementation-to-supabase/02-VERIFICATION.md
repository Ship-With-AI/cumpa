---
phase: 02-move-the-implementation-to-supabase
verified: 2026-09-04
status: passed
score: 81/81 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 02: Move the implementation to Supabase — Verification Report

**Phase Goal:** Replace the blocked standalone support backend with Supabase Postgres, Auth, and Edge Functions while preserving optional webhook-authoritative USD $49.99 support and machine-wide prompt suppression, replacing email recovery with installation-bound GitHub OAuth restoration, and completing a verified Supabase-only production cutover.

**Verified:** 2026-09-04
**Status:** **passed**
**Re-verification:** No — initial verification

## Goal Achievement

The implementation has a single active authority path: private Supabase schema/RPCs, three Supabase Edge Functions, and the existing local Cumpa loopback/UI capability. The retired Render/standalone Node runtime, email recovery, and legacy support workspace are absent. The immutable production evidence is independently revalidated below.

### Observable Truths

The roadmap defines the goal and requirements but no separate `success_criteria` array. The 81 plan-frontmatter truths are therefore the phase must-have truth set. Every group was checked against implementation, focused behavior, or immutable evidence; plan summaries were treated as navigation only, not proof.

| Plan | Truths | Status | Concrete implementation / independently checked evidence |
|---|---:|---|---|
| 02-01 | 3/3 | ✓ VERIFIED | Exact pins and restricted hosted-only use are documented in `02-01-SUMMARY.md`; active root manifest/package boundary and later package scan exclude hosted credentials from Cumpa runtime. |
| 02-02 | 4/4 | ✓ VERIFIED | `supabase/migrations/20260814000000_support_authority.sql` has five private RLS tables, constrained one-use intents, transactional RPCs, service-role-only grants, and no identity/recovery columns; two clean cycles and database assertions are digest-bound in `02-17-LOCAL-PACKAGE-SECURITY-EVIDENCE.md`. |
| 02-03 | 5/5 | ✓ VERIFIED | `support-api`, `support-flow`, `stripe-webhook`, `_shared/validation.ts`, and `_shared/fulfillment.ts` form the bounded anonymous/OAuth/Checkout/webhook authority chain. Focused Deno tests passed 17/17. |
| 02-04 | 4/4 | ✓ VERIFIED | `src/contracts/api.ts`, `src/server/support-client.ts`, `capabilities.ts`, and `routes.ts` expose only action/status/refresh, use configured HTTPS, and promote only a verified status. Focused Vitest passed 10/10. |
| 02-05 | 6/6 | ✓ VERIFIED | `src/web/api/client.ts`, `App.vue`, and `SupportDialog.vue` wire optional Support/Restore to a new hosted tab while retaining review use, polling-driven close, and dismissal. Focused browser contract completed successfully (4 tests). |
| 02-06 | 4/4 | ✓ VERIFIED | `createConfiguredSupportCapability()` returns before constructing store/client unless an explicit HTTPS `CUMPA_SUPPORT_SERVICE_URL` exists; pinned and exact apps receive the same optional capability. Local configured-absent collector is one of the six validated inputs. |
| 02-07 | 6/6 | ✓ VERIFIED | `.github/workflows/deploy-supabase-production.yml` is push-to-main only, serialized, uses credential-free `repository-gates`, and binds `production` only to `deploy-production`. The workflow verifier passed locally. |
| 02-08 | 7/7 | ✓ VERIFIED | Workflow and verifier derive the canonical origin only from an exact 20-character protected ref; `support-flow` derives routes from `SUPABASE_URL`. First immutable deployment evidence is a validated final input. |
| 02-09 | 7/7 | ✓ VERIFIED | `02-08-TEST-DEPLOYMENT-EVIDENCE.md`, acceptance marker, and `02-09-ACCEPTANCE-EVIDENCE.md` are independently validated as immutable canonical-origin deployment, approved browser acceptance, hostile matrix, and fixture-manifest evidence. |
| 02-10 | 5/5 | ✓ VERIFIED | `02-10-LIVE-PROMOTION-EVIDENCE.md` is independently validated as exact cleanup/zero proof followed by same-project production-live promotion and non-destructive smoke. |
| 02-11 | 3/3 | ✓ VERIFIED | `render.yaml` and the seven specified standalone provider/schema files are absent; active Supabase migration/functions and local Fastify app remain. |
| 02-12 | 3/3 | ✓ VERIFIED | Legacy Node app/server, recovery state/routes, installation route, and Node webhook route are absent; `src/server/app.ts` and all three Edge Functions remain. |
| 02-13 | 3/3 | ✓ VERIFIED | `tests/e2e/support-payment.spec.ts` and `support-restore.spec.ts` are present; the stale `support-recovery.spec.ts` and retired service tests are absent. Active E2E evidence remains part of final collector inventory. |
| 02-14 | 3/3 | ✓ VERIFIED | The `services/support` package/toolchain files and standalone Postgres wrapper are absent; retained root package graph supports Fastify, Supabase CLI, Deno, Vitest, and Playwright. |
| 02-15 | 5/5 | ✓ VERIFIED | `scripts/verify-supabase-support.mjs` implements scope-aware retirement/exact-origin scanning and a six-input final checker; retirement evidence is a validated clean configured-absent record with zero violations. |
| 02-16 | 7/7 | ✓ VERIFIED | `scripts/build-bin.mjs` embeds only a valid release-time canonical origin and only as a fallback launcher assignment; approved immutable release evidence binds package, route probes, zero authority, and non-destructive smoke. |
| 02-17 | 6/6 | ✓ VERIFIED | The local/package/security collector and six-input final validator are implemented; final evidence binds all six distinct records, the approved release attestation, exact origin, run, and package digest. |

**Score:** **81/81** plan must-have truths verified; **0** present-but-behavior-unverified.

### Required Artifacts and Data Flow

| Artifact group | L1/L2/L3/L4 status | Evidence |
|---|---|---|
| Private authority schema and database tests | ✓ EXISTS / ✓ substantive / ✓ Edge RPC consumers / ✓ transactional storage | Migration defines constraints, RLS, RPCs, and grants; `support-api`, `support-flow`, and webhook invoke the matching RPCs; the final local record requires two reset/test/migration/lint cycles. |
| Hosted Edge functions | ✓ EXISTS / ✓ substantive / ✓ deployed route chain / ✓ real authority RPC flow | `support-api` creates a hashed intent or returns only boolean status; `support-flow` validates GitHub Auth before server-created Checkout or generic restore; webhook verifies raw signature before invariant classification and settlement. |
| Local capability and routes | ✓ EXISTS / ✓ substantive / ✓ app/CLI/UI wired / ✓ persisted support-store flow | `src/server/app.ts` constructs the capability only after valid configuration; routes conditionally register action/status/refresh; `App.vue` gets the advertised session capability and calls the local APIs. |
| Browser dialog | ✓ EXISTS / ✓ substantive / ✓ `App.vue` events and `SessionClient` / ✓ rendered state from loopback status | `SupportDialog.vue` emits Support/Restore/dismiss; `App.vue` opens the returned flow in a separate tab, polls only through refresh, and transitions to thank-you/close only after `verified`. Focused Playwright exercised this flow. |
| Protected workflow and configured package | ✓ EXISTS / ✓ substantive / ✓ guarded release builder / ✓ immutable package evidence | Workflow shape check passed; protected job derives the origin after ref shape validation, invokes `scripts/build-bin.mjs`, verifies the generated launcher, and emits the release artifact. |
| Retirement, local security, release, and final evidence | ✓ EXISTS / ✓ substantive / ✓ validator consumes every record / ✓ digest-bound lineage | `--check-final` recomputed all six input bindings, kind/version/status/digest requirements, common origin, run lineage, release approval, zero authority, and release route signatures. |

### Key Link Verification

| From | To | Status | Verification |
|---|---|---|---|
| `support-api` | `create_support_intent`, `installation_status` | ✓ WIRED | Direct service-role RPC calls after strict action/installation validation. |
| `support-flow` | GitHub Auth, claim/restore/Checkout-record RPCs | ✓ WIRED | `signInWithOAuth`, PKCE exchange, `getUser`, claim, then either restore or server-created Checkout and record RPC. |
| `stripe-webhook` | `fulfill_checkout_session` | ✓ WIRED | Untouched `request.text()` is signature-verified before Stripe retrieval, invariant classification, and one settlement helper/RPC. |
| Loopback routes | support capability | ✓ WIRED | `/api/support/start`, `/status`, and `/refresh` delegate to the optional capability; no capability means routes are absent. |
| CLI/session factories | optional capability gate | ✓ WIRED | `run.ts` supplies the shared configured capability for ordinary, attached, and exact-patch launch paths; both app factories accept it. |
| Browser | loopback APIs | ✓ WIRED | `SessionClient` parses strict action/status contracts; `App.vue` calls it for action handoff and status-only promotion. |
| Protected ref | configured package origin | ✓ WIRED | Workflow validates ref shape, derives the in-memory origin, passes `CUMPA_RELEASE_SUPPORT_SERVICE_URL` only to build, then scans generated launcher. |
| Six evidence inputs and approval | final conclusion | ✓ WIRED | `collectFinalInputs()` enforces distinct paths/kinds/versions/digests and `validateReleaseApproval()` binds release-record SHA-256, run ID, and package digest. |

## Requirements Coverage

All 12 Phase 02 requirement IDs are claimed by plans; none is orphaned.

| Requirement | Status | Implementation and evidence |
|---|---|---|
| PAY-01 | ✓ SATISFIED | Server creates `mode: "payment"` Checkout with configured price and quantity one; dialog states optional USD $49.99 support; Deno and browser evidence cover the flow. |
| PAY-02 | ✓ SATISFIED | Support is optional and capability-gated; no review action depends on payment. Playwright contract covers dismissal/unrestricted review and configured-absent mode. |
| PAY-03 | ✓ SATISFIED | Only `stripe-webhook` reaches fulfillment after `constructEventAsync` over raw body and exact-product verification; local promotion accepts only verified status. Deno and Vitest focus tests passed. |
| PAY-04 | ✓ SATISFIED | Active local/package scans reject protected values and unauthorized origins; configured package uses only the canonical public origin. Release package SHA-256 is approved and bound. |
| SUP-01 | ✓ SATISFIED | Release launcher supplies the canonical default origin; `App.vue` opens the dialog while unverified only when capability is advertised. |
| SUP-02 | ✓ SATISFIED | `SupportDialog.vue` renders the optional USD $49.99 Support action and hosted handoff; browser contract completed successfully. |
| SUP-03 | ✓ SATISFIED | Dialog explicitly preserves usable review, supports Not now/Keep reviewing, and does not gate workspace features. |
| SUP-04 | ✓ SATISFIED | `refreshSupportStatus()` alone moves to thank-you and schedules close after verified; browser test covers polling promotion. |
| SUP-05 | ✓ SATISFIED | Persisted `SupportStateV1` is retained and server refresh promotes monotically; future-launch suppression is covered by the focused browser contract and accepted evidence. |
| REC-01 | ✓ SATISFIED | Hosted `support-flow` uses GitHub-only Supabase Auth redirect/callback; no email/magic-link active runtime remains. |
| REC-02 | ✓ SATISFIED | A high-entropy intent is hash-persisted, stored in Secure/HttpOnly/SameSite cookie state, consumed once, and no OAuth material returns to local Cumpa. |
| REC-03 | ✓ SATISFIED | Schema supports unlimited distinct installation bindings for a paid user while protecting each installation owner; restore tests and approved acceptance evidence cover paid/unpaid generic completion. |

**Coverage:** **12/12 requirements satisfied; 81/81 must-have truths verified; 50 plan-declared artifact entries accounted for through the consolidated artifact groups above.**

## Immutable Final Evidence and Release Lineage

Production canonical origin: `https://boruowxemintmdojkibd.supabase.co`.

| Input | Kind | SHA-256 bound by final evidence |
|---|---|---|
| `02-08-TEST-DEPLOYMENT-EVIDENCE.md` | `deployment-run` | `e54d206c72e3c889fff4fc715ba6e5e9081bc62db3920186e1eede25e3529cfc` |
| `02-09-ACCEPTANCE-EVIDENCE.md` | `acceptance` | `d53aa258297e14f30b56786b1ca7ffc310b0d3397952a016a72f2e0a8dbe9db9` |
| `02-10-LIVE-PROMOTION-EVIDENCE.md` | `promotion` | `080857e25322fe0dbbf530877bb688a505af9ec9fe74992749e8f53a220d24f3` |
| `02-15-RETIREMENT-EVIDENCE.md` | `retirement-review` | `9474b46d3d2a3898e208af1ceef6efdef981fe9834a740c1e0c5142648380877` |
| `02-16-RELEASE-EVIDENCE.md` | `release` | `ccf63f98b2428bca82cd35e450609c9f494865533444c09046f3acafd0b1fc22` |
| `02-17-LOCAL-PACKAGE-SECURITY-EVIDENCE.md` | `local-package-security` | `08ab7c45f314295d640261df85f79bfed168efbb545abfbb46634e963d97de00` |

The configured release record and final record agree on immutable GitHub run **33791539888**, commit `e29895d33cf077ae98fc16c56b697e9641188d4e`, and the production package digest **`6908ad06d84048f75ba4140bdb22fff48d73c43714e9aef5d2e4c1655b76e4b3`**. The release evidence records four non-destructive route signatures, zero authority counts both before and after smoke, and the separately approved release attestation is validator-bound to the release record, run, and package digest.

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Six-input immutable final evidence, common canonical origin, release approval, immutable run, exact package digest, zero authority | `node scripts/verify-supabase-support.mjs --check-final …` with all six named evidence paths | Exit 0; no output | ✓ PASS |
| Protected workflow shape and configured release artifact contract | `node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml --require-environment production --require-release-artifact` | Exit 0; no output | ✓ PASS |
| Edge authority boundaries, OAuth callback, raw webhook signature/order and replay behavior | `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests` | 17 passed, 0 failed | ✓ PASS |
| Local action/status/refresh contract, monotonic promotion, disabled/configured capability behavior | `npx vitest run tests/api/support.test.ts` | 10 passed, 0 failed | ✓ PASS |
| Rendered dialog: disabled mode, optional/unrestricted review, handoff/cancellation, polling close/suppression | `npx playwright test --config=tests tests/integration/support-dialog.spec.ts` | Completed successfully; 4 focused tests started and completed | ✓ PASS |

The final local/package/security immutable input separately records configured-absent local execution, exact repository suite inventory, two clean database cycles, Deno tests, package scans, installed-package smoke, and workflow checks. It is revalidated by the final check rather than rerun here, avoiding mutation of immutable evidence or broad duplicate execution.

## Anti-Patterns Found

| Scope | Result | Severity |
|---|---|---|
| Active runtime/workflow/scripts | No `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, or `PLACEHOLDER` markers found in inspected Phase 02 implementation surfaces. | None |
| Active source/docs/Supabase tree | Legacy Render/service/email-recovery terms appear only in the database negative assertion that proves the prohibited columns are absent. | None |
| Retired implementation | All 22 specifically planned legacy runtime, route, workspace, toolchain, and stale recovery-test paths are absent. | None |
| Security/data flow | No browser/local authority promotion path bypasses refresh; no legacy compatibility routes or alternate hosted runtime was found in inspected active surfaces. | None |

## Human Verification Required

None. The plan-level external OAuth, payment, provider, and release-approval checkpoints are already represented by the approved immutable acceptance/release records, and the read-only final validator independently accepted their bindings. No additional hosted or destructive action was performed for this verification.

## Gaps Summary

No blockers or warnings found. Phase 02 achieves the specified Supabase-only cutover, preserves the optional/webhook-authoritative support behavior, replaces email recovery with installation-bound GitHub OAuth restoration, and carries a validated six-input immutable release lineage.

---

_Verified: 2026-09-04_
_Verifier: gsd-verifier_
