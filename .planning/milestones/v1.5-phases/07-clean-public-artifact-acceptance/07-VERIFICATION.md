---
phase: 07-clean-public-artifact-acceptance
verified: 2026-09-12T16:30:19Z
status: gaps_found
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Global, npx, and marketplace paths retain unrestricted review and export behavior for verified voluntary support."
    status: partial
    reason: "A genuine Restore attempt reached the hosted completion page without a live entitlement. Each verified row is therefore honestly blocked as live-entitlement-unavailable; D-07 forbids a replacement purchase and D-09 forbids the service/database deployment needed to repair it."
    artifacts:
      - path: ".planning/phases/07-clean-public-artifact-acceptance/07-ACCEPTANCE-EVIDENCE.json"
        issue: "The verified row is blocked for global, npx, and marketplace; it does not establish the verified-state workflow."
      - path: "supabase/functions/support-flow/index.ts"
        issue: "The Restore callback discards the false return from restore_installation and redirects to completion."
      - path: "supabase/migrations/20260814000000_support_authority.sql"
        issue: "restore_installation returns false when the live supporters row is absent."
    missing:
      - "Authorized live-entitlement/product repair work, followed by a genuine verified-state walkthrough on all required paths."
---

# Phase 7: Clean Public-Artifact Acceptance Verification Report

**Phase Goal:** Every supported public installation path completes the existing browser-review workflow from a clean environment without a source checkout or local release inputs.

**Verified:** 2026-09-12T16:30:19Z  
**Status:** `gaps_found` — the Phase 7 record is correctly **partially blocked**, not falsely passed.  
**Re-verification:** No — initial verification.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A clean global installation of exact public `@shipwithai/cumpa@1.5.0` completes the existing browser workflow without a checkout, workspace link, or local tarball. | ✓ VERIFIED | The global adapter rejects a pre-resolvable `cumpa`, installs only the pinned registry package, rejects symlink/escaped roots, checks the npm-recorded resolution, and executes the generated binary (`tests/helpers/public-runtime.ts:153-156,281-337`). The committed record marks global ACC-01 passed and records all browser-contract flags and asset checks (`07-ACCEPTANCE-EVIDENCE.json:43-99`). |
| 2 | An empty-cache literal `npx --yes @shipwithai/cumpa@1.5.0` installation completes the workflow without a prior/local install. | ✓ VERIFIED | The npx adapter asserts an empty owned cache immediately before executing npm's `npx-cli.js --yes @shipwithai/cumpa@1.5.0`, rejects an existing local binary, checks populated cache and contained installed executable, and checks pinned resolution (`tests/helpers/public-runtime.ts:365-415`). The npx ACC-02 record is passed with `npmCacheEntryCountBefore: 0` and full workflow/asset evidence (`07-ACCEPTANCE-EVIDENCE.json:100-147`). |
| 3 | A clean OMP profile installs the public marketplace skill, invokes a separately installed exact CLI, finishes browser review, and receives validated canonical output. | ✓ VERIFIED | The profile redirects HOME/XDG state, adds `Ship-With-AI/skills`, installs `ship-with-ai` project-scope, requires installed-skill realpath outside the checkout, and compares the published skill digest (`tests/helpers/omp-profile.ts:89-153,250-297`). The driver requires checker-before-launch, isolated-prefix executable realpath, readiness before terminal zero exit, parsed canonical output, and browser-entered comment/summary agreement (`tests/package/marketplace-profile-acceptance.test.ts:70-240`). The marketplace ACC-03 row is passed (`07-ACCEPTANCE-EVIDENCE.json:148-198`). |
| 4 | Global, npx, and marketplace paths retain unrestricted review and export when voluntary support is unpaid, dismissed, **and verified**. | ✗ PARTIALLY BLOCKED | Unverified and dismissed rows are passed for all three paths. Every verified row is explicitly `blocked`, with `reason: live-entitlement-unavailable` and `substituted: false` (`07-ACCEPTANCE-EVIDENCE.json:56-74,110-127,159-176`). That is required honest D-08 behavior, but it does not satisfy the roadmap's verified-state condition. |

**Score:** 3/4 must-haves verified (0 present-but-behavior-unverified).

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `tests/helpers/public-artifact-identity.ts` | Immutable Phase 5 identity and containment/resolution guards. | VERIFIED | Pins name/version, registry tarball, bytes, SHA-256, npm SHA-1, and integrity; tests reject mismatched registry data, `file:` resolutions, missing fields, sibling-prefix escape, and unsafe PATH entries (`tests/unit/public-artifact-identity.test.ts:1-110`). |
| `tests/helpers/public-runtime.ts` | Isolated global and npx public-package adapters. | VERIFIED | Sanitized PATH does not inherit host PATH; both adapters require the pinned package and contained executable (`tests/helpers/public-runtime.ts:89-253,281-415`). |
| `tests/e2e/agent-ready-export.spec.ts` and `tests/e2e/package-assets.spec.ts` | Existing full browser-review/export and browser-asset contract driven through the resolved runtime. | VERIFIED | Review test uses the launch descriptor and covers accepted comments/summary, relaunch byte equality, isolated drafts, Markdown plus canonical JSON, Finish, and exact-patch canonical output (`tests/e2e/agent-ready-export.spec.ts:250-850`). Asset test checks generated CLI version/help and complete served asset/worker/codicon graph (`tests/e2e/package-assets.spec.ts:40-244`). |
| `tests/package/marketplace-profile-acceptance.test.ts` | Actual installed-skill agent lifecycle and canonical-result proof. | VERIFIED | It starts the browser reviewer and OMP separately, records readiness and completion separately, rejects auto-install/upgrade/npx/archive substitutes, and validates the received canonical export (`tests/package/marketplace-profile-acceptance.test.ts:70-240`). |
| `tests/e2e/public-support-states.spec.ts` | Real hosted support matrix with no fabricated verified state. | PARTIALLY BLOCKED | Real-state branches perform unrestricted browser review/export when observed; a Restore completion that remains unverified becomes `live-entitlement-unavailable`, not a pass (`tests/e2e/public-support-states.spec.ts:309-523`). |
| `scripts/write-acceptance-evidence.mjs` and `07-ACCEPTANCE-EVIDENCE.json` | One bounded, conservative consolidated record. | VERIFIED | Writer requires ACC-01…ACC-04 and all three support states per source, rejects incomplete/mislabelled blocked rows, derives `partially-blocked`, and rejects private paths/origins/credential-class keys (`scripts/write-acceptance-evidence.mjs:14-275`; `tests/unit/acceptance-evidence.test.ts:1-170`). |
| `docs/distribution-operations.md` | Durable public-acceptance boundary and limitations. | VERIFIED | The Phase 7 section names the three public paths, bounded evidence, honest prerequisite degradation, no source/local archive substitute, shared-support narrowing, OMP-only runtime scope, and no publish/push/deploy action (`docs/distribution-operations.md`, “Phase 7 — public-artifact acceptance boundary”). |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Phase 5 release evidence | Public global/npx runtime guards | `PINNED_PUBLIC_ARTIFACT` | VERIFIED | Phase 5 registry evidence records the same archive SHA-256 `dc8f…7141`, npm SHA-1, SHA-512, bytes, and tarball URL (`05-RELEASE-EVIDENCE.json:25-55,130-170`); Phase 7 hard-pins those values and the committed record repeats them (`07-ACCEPTANCE-EVIDENCE.json:29-36`). |
| Public runtime adapters | Existing browser tests | `resolveAcceptanceRuntime()` launch descriptor | VERIFIED | Browser suites launch `acceptance.launch`, rather than source entrypoints (`tests/e2e/agent-ready-export.spec.ts:250-850`; `tests/e2e/package-assets.spec.ts:40-244`). |
| Phase 6 public collection | Isolated OMP skill discovery | marketplace add/install plus `SKILL.md` digest | VERIFIED | Phase 6 records collection `0.3.0`, commit `984e…28d5`, and skill digest `8974…0220` (`06-PUBLICATION-EVIDENCE.json:1-18`); the Phase 7 profile asserts that digest and checkout separation (`tests/helpers/omp-profile.ts:130-310`). |
| Per-path runtime records | Durable acceptance record | evidence writer schema/status derivation | VERIFIED | Missing source/state coverage and invalid blocked rows are rejected before publication; the committed evidence has all required rows (`scripts/write-acceptance-evidence.mjs:14-275`; `07-ACCEPTANCE-EVIDENCE.json:43-198`). |
| Hosted Restore | Verified support truth | `restore_installation` RPC then support refresh | BLOCKED, correctly surfaced | The SQL returns `false` for a user without a `supporters` row (`supabase/migrations/20260814000000_support_authority.sql:177-188`), while the callback discards that Boolean and redirects to completion (`supabase/functions/support-flow/index.ts:100-145`). The test recognizes this mismatch and emits a blocked, non-substituted row. |

## Evidence, Provenance, and Boundary Assessment

### Exact public provenance and full review contract

The public test code prevents the common false-positive paths: inherited global executable, `file:`/local resolution, a symlinked package root, sibling-prefix realpath escape, an arbitrary registry, and a reused npx cache. The identity unit tests are focused behavioral guards, not source-text assertions. The review contract is not reduced to `--version`: the installed launch descriptor drives the established browser scenarios for comments, accepted summary, persistence/relaunch, paired Markdown/canonical JSON output, isolated drafts, exact-patch canonical output, and Finish.

The committed acceptance record binds both paths to the same immutable Phase 5 package identity and records browser asset graph fields as true. This is adequate evidence for ACC-01 and ACC-02 without re-running the deliberately excluded long public-install suites.

### Marketplace/OMP contract

The marketplace proof is stronger than a direct checker or direct CLI smoke: it creates the profile, installs the public collection, discovers the installed skill outside the checkout, has OMP run the discovered skill, observes browser readiness separately from terminal completion, and accepts output only after zero exit and canonical-schema parsing. The Phase 6 four-agent runtime waiver remains unchanged: this is OMP proof only, not Claude Code/Codex/Pi proof (`06-PUBLICATION-EVIDENCE.json:19-58`; `07-ACCEPTANCE-EVIDENCE.json:200-208`).

### ACC-04 and D-07/D-08/D-09

ACC-04 is the only unmet must-have. The record does **not** substitute passed unverified/dismissed observations for verified behavior. It has a complete three-path matrix, labels all verified rows `live-entitlement-unavailable`, and sets `substituted: false`. That is the prescribed D-08 outcome after all reachable checks; it is not a Phase 7 harness omission.

The underlying known product defect is already documented, not newly discovered by this verification: Restore can render completion after an unsuccessful linkage, and the verification modal does not reach a terminal state. The account's former support was Stripe test/sandbox data while the endpoint is live, leaving no live `supporters` row. A new purchase is forbidden by D-07; repair/deploy/provider/database actions are forbidden by D-09. Therefore this verification preserves the outstanding product requirement as a partial gap instead of misrepresenting it as a test failure or a pass.

### Evidence redaction and declared isolation limitations

The evidence writer's allowlist/rejection logic plus the targeted evidence scan found no absolute `/Users/` or `/home/` paths, hosted support origin, installation-ID-shaped value, or credential/token/secret/origin/path/email key in `07-ACCEPTANCE-EVIDENCE.json`. The record binds only the two approved public URLs and logical identities. The focused unit suite passed its privacy and status-conservatism cases.

The record expressly discloses, rather than hides:

- local process isolation rather than fresh-machine proof;
- one macOS/browser combination, no platform matrix;
- OMP-only runtime proof and the unexercised Phase 6 targets;
- one shared voluntary-support HOME/install identity across all paths, while npm cache/config/prefix, browser profile, checkout, and PATH remain isolated; and
- a temporary read-only copy of the operator's provider credential in the isolated OMP profile, not an independent model authentication (`07-ACCEPTANCE-EVIDENCE.json:199-208`).

These are accepted scope narrowings, not evidence of additional paths or support states.

### D-12 / execution boundary

Read-only repository checks place the phase on `main` (`git branch --show-current` returned `main`). The Phase 7 commit history includes the seven plan series through `4b5137e`; the phase range changes acceptance harnesses, tests, package scripts, documentation, and bounded evidence rather than a branch/worktree or deployment configuration (`git log --grep '07-' -n 40`; `git diff --name-only 9a24ab5^..4b5137e`). The Phase 7 documentation explicitly limits this work to local acceptance and says publication authority was already consumed (`docs/distribution-operations.md`, Phase 7 section). The summaries/evidence record the actual public installs and one protected Restore attempt, but no publish, push, deployment, payment, provider configuration, or database mutation. This supports D-12 within observable repository and committed-operation evidence; absence of an external side effect cannot be proven by local source inspection alone.

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Evidence-status derivation, privacy rejection, identity integrity validation, shared-support limitation, public identity guards, and scenario-record status preservation | `npx vitest run tests/unit/acceptance-evidence.test.ts tests/unit/public-artifact-identity.test.ts tests/unit/publish-scenario-record.test.ts` | 3 test files passed; 16 tests passed; exit 0 (2026-09-12 verification run). | PASS |
| Long public global/npx and marketplace acceptance flows | Not re-run by design. | Excluded by verification constraints; reviewed against committed evidence, actual adapters/specs, and recorded real acceptance output. | NOT RE-RUN |

## Probe Execution

No phase-declared `probe-*.sh` file or conventional `scripts/**/probe-*.sh` file exists. `glob scripts/**/probe-*.sh` and a search of all Phase 7 PLAN/SUMMARY files found none. No probe was required or substituted.

## Requirements Coverage

| Requirement | Source plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| ACC-01 | 07-01, 07-02, 07-03, 07-06, 07-07 | Exact public global install and full browser review without checkout/local artifact. | VERIFIED | Pinned global adapter and global evidence row (`tests/helpers/public-runtime.ts:281-337`; `07-ACCEPTANCE-EVIDENCE.json:43-99`). |
| ACC-02 | 07-01, 07-02, 07-03, 07-06, 07-07 | Empty-cache literal `npx --yes` run and full browser review without local/prior installation. | VERIFIED | Cache/prefix/path guards and npx evidence row (`tests/helpers/public-runtime.ts:365-415`; `07-ACCEPTANCE-EVIDENCE.json:100-147`). |
| ACC-03 | 07-05, 07-07 | Public marketplace installation, installed skill discovery, separately installed exact CLI, supervised Finish, canonical result. | VERIFIED | Isolated profile and lifecycle driver; marketplace evidence row (`tests/helpers/omp-profile.ts:130-310`; `tests/package/marketplace-profile-acceptance.test.ts:70-240`; `07-ACCEPTANCE-EVIDENCE.json:148-198`). |
| ACC-04 | 07-04, 07-05, 07-06, 07-07 | Unrestricted review/export for unpaid, dismissed, and verified support on all three paths. | PARTIALLY BLOCKED | Passed observed unverified/dismissed rows; non-substituted blocked verified rows (`07-ACCEPTANCE-EVIDENCE.json:56-74,110-127,159-176`). |

## Anti-Patterns and Known Follow-ups

| File / concern | Classification | Assessment |
|---|---|---|
| `supabase/functions/support-flow/index.ts` Restore completion after false RPC result | Existing product defect; out of Phase 7 deployment scope | Carries the ACC-04 partial gap. Future authorized product work should propagate the false RPC result into an error/non-completion response and then repeat genuine live verified-state acceptance. |
| `tests/e2e/agent-ready-export.spec.ts` undeclared `completedScenarios` | Inherited Phase 7 defect, repaired | Commit `4f6804c` repaired the runtime failure before the final real public acceptance. No unresolved issue remains from it. |
| `tsconfig.json` / `tsconfig.web.json` exclude `tests/` | Verification blind spot | A green production/web typecheck does not typecheck tests; this allowed the prior undeclared variable to survive. Carry forward as a test-tooling follow-up, not as proof that the repaired public paths failed. |
| Evidence isolation scope | Declared limitation | Shared support identity and reused temporary provider credential are explicit. Do not generalize them into fresh-machine, independent-authentication, or multi-agent coverage. |

## Gaps Summary

The phase is **partially blocked** because ACC-04's verified-support state could not be genuinely reached. The output is intentionally `gaps_found` under the verifier's goal-backward taxonomy: the literal roadmap truth is not yet true. This does **not** recommend fabricating state, reusing unverified evidence, purchasing again, or deploying a product fix under Phase 7. D-08 required exactly this honest bounded outcome.

The next authorized work must resolve the live entitlement/Restore correctness issue or otherwise obtain a permitted genuine live entitlement, then rerun only the verified-state portions for global, npx, and marketplace and regenerate the bounded record. Until then, ACC-01 through ACC-03 are verified; ACC-04 remains incomplete.

---

_Verified: 2026-09-12T16:30:19Z_  
_Verifier: Verify07 (gsd-verifier)_
